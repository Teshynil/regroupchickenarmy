<?php

namespace Bga\Games\RegroupChickenArmy\Components;

use Bga\Games\RegroupChickenArmy\Game;
use BgaUserException;

class Resources
{
    // Default starting values for resources
    const DEFAULT_FIGHTER = 0;
    const DEFAULT_WIZARD = 0;
    const DEFAULT_SHIELD = 0;
    const DEFAULT_BARRIER = 0;
    const DEFAULT_POTION = 0;
    const DEFAULT_COIN = 0;

    /**
     * Initialize resources for a player's leader
     */
    public static function initializeResources(Game $game, int $leaderId): void
    {
        $game->DbQuery("INSERT INTO `resources`
            (`leader_id`, `fighter`, `wizard`, `shield`, `barrier`, `potion`, `coin`)
            VALUES (
                $leaderId,
                " . self::DEFAULT_FIGHTER . ",
                " . self::DEFAULT_WIZARD . ",
                " . self::DEFAULT_SHIELD . ",
                " . self::DEFAULT_BARRIER . ",
                " . self::DEFAULT_POTION . ",
                " . self::DEFAULT_COIN . "
            )"
        );

        $playerId = $game->getUniqueValueFromDB(
            "SELECT player_id FROM player WHERE leader_id = $leaderId"
        );

        if ($playerId) {
            $game->DbQuery("UPDATE player SET player_score = 30 WHERE player_id = $playerId");
        }
    }

    /**
     * Initialize resources for all players
     */
    public static function initializeAllResources(Game $game): void
    {
        $players = Players::getRemainingPlayers($game);

        foreach ($players as $playerId => $player) {
            $leaderId = $player['leader_id'];
            if ($leaderId) {
                self::initializeResources($game, $leaderId);
            }
        }
    }

    /**
     * Get resources for a specific leader
     */
    public static function getResources(Game $game, int $leaderId): array
    {
        return $game->getObjectFromDB(
            "SELECT `fighter`, `wizard`, `shield`, `barrier`, `potion`, `coin`
             FROM `resources` WHERE `leader_id` = $leaderId"
        );
    }

    /**
     * Get resources for all leaders
     */
    public static function getAllResources(Game $game): array
    {
        return $game->getCollectionFromDb(
            "SELECT `leader_id`, `fighter`, `wizard`, `shield`, `barrier`, `potion`, `coin`
             FROM `resources`"
        );
    }


    /**
     * Calculate all resources on a board using BFS traversal
     * @private
     */
    private static function calculateAllBoardResources(Game $game, int $boardId): array
    {
        // Get the board grid
        $grid = Boards::getBoardGrid($game, $boardId);
        $resources = [
            'fighter' => 0,
            'wizard' => 0,
            'shield' => 0,
            'barrier' => 0,
            'potion' => 0,
            'coin' => 0
        ];

        // Create a visited map to track processed cells
        $visited = array_fill(0, Boards::GRID_SIZE, array_fill(0, Boards::GRID_SIZE, false));

        // Directions for orthogonal adjacent cells (up, right, down, left)
        $directions = [
            [-1, 0], // Up
            [0, 1],  // Right
            [1, 0],  // Down
            [0, -1]  // Left
        ];

        // Resource type mapping
        $resourceMapping = [
            'F' => 'fighter',
            'W' => 'wizard',
            'S' => 'shield',
            'B' => 'barrier',
            'P' => 'potion',
            'C' => 'coin',
            'M' => 'coinAndPotion'
        ];

        // Traverse the grid from top to bottom, left to right
        for ($y = 0; $y < Boards::GRID_SIZE; $y++) {
            for ($x = 0; $x < Boards::GRID_SIZE; $x++) {
                // Skip empty slots or already visited cells
                if ($grid[$y][$x] === Boards::EMPTY_SLOT || $visited[$y][$x]) {
                    continue;
                }

                $cellContent = $grid[$y][$x];
                $firstChar = substr($cellContent, 0, 1);

                // Extract quantity (default to 1 if no number is specified)
                $quantity = 1;
                if (strlen($cellContent) > 1 && is_numeric(substr($cellContent, 1))) {
                    $quantity = (int)substr($cellContent, 1);
                }

                // Special case for C, P, M - count them directly without requiring connections
                if ($firstChar === 'C') {
                    $resources['coin'] += $quantity;
                    $visited[$y][$x] = true;
                    continue;
                } else if ($firstChar === 'P') {
                    $resources['potion'] += $quantity;
                    $visited[$y][$x] = true;
                    continue;
                } else if ($firstChar === 'M') {
                    $resources['coin'] += $quantity;
                    $resources['potion'] += $quantity;
                    $visited[$y][$x] = true;
                    continue;
                }

                // For other resources (F, W, S, B), use BFS to find connected resources
                if (isset($resourceMapping[$firstChar])) {
                    $resourceType = $resourceMapping[$firstChar];

                    // BFS to find connected resources of the same type
                    $queue = [[$y, $x]];
                    $connectedCells = [];
                    $cellsVisited = [];
                    $totalQuantity = 0;

                    while (!empty($queue)) {
                        [$currentY, $currentX] = array_shift($queue);

                        // Skip if already processed in this BFS
                        $cellKey = "$currentY,$currentX";
                        if (isset($cellsVisited[$cellKey])) {
                            continue;
                        }

                        $cellsVisited[$cellKey] = true;
                        $connectedCells[] = [$currentY, $currentX];

                        // Extract quantity from current cell
                        $currentContent = $grid[$currentY][$currentX];
                        $currentQuantity = 1;
                        if (strlen($currentContent) > 1 && is_numeric(substr($currentContent, 1))) {
                            $currentQuantity = (int)substr($currentContent, 1);
                        }
                        $totalQuantity += $currentQuantity;

                        // Check adjacent cells
                        foreach ($directions as [$dy, $dx]) {
                            $adjY = $currentY + $dy;
                            $adjX = $currentX + $dx;

                            // Skip if out of bounds
                            if ($adjY < 0 || $adjY >= Boards::GRID_SIZE || $adjX < 0 || $adjX >= Boards::GRID_SIZE) {
                                continue;
                            }

                            // Skip empty slots
                            if ($grid[$adjY][$adjX] === Boards::EMPTY_SLOT) {
                                continue;
                            }

                            // Add to queue if contains the same resource type
                            if (substr($grid[$adjY][$adjX], 0, 1) === $firstChar && !isset($cellsVisited["$adjY,$adjX"])) {
                                $queue[] = [$adjY, $adjX];
                            }
                        }
                    }

                    // If we found at least 2 connected cells (including the starting cell)
                    if (count($connectedCells) >= 2) {
                        $resources[$resourceType] += $totalQuantity;

                        // Mark all cells in this group as visited
                        foreach ($connectedCells as [$visitedY, $visitedX]) {
                            $visited[$visitedY][$visitedX] = true;
                        }
                    }
                }
            }
        }

        return $resources;
    }

    /**
     * Update leader resources based on their board configuration
     */
    public static function updateResourcesFromBoard(Game $game, int $boardId, bool $notify = true): void
    {
        // Calculate resources from the board
        $boardResources = self::calculateAllBoardResources($game, $boardId);

        // Update each resource type
        foreach ($boardResources as $resourceType => $amount) {
            // Update the resource in the database
            $game->DbQuery(
                "UPDATE `resources` SET `$resourceType` = $amount WHERE `leader_id` = $boardId"
            );
        }

        // Get updated resources for notification
        $updatedResources = self::getResources($game, $boardId);

        // Get player ID for this leader
        $playerId = $game->getUniqueValueFromDB(
            "SELECT player_id FROM player WHERE leader_id = $boardId"
        );

        // Notify players about the resource update
        if ($notify) {
            $game->notifyAllPlayers('resourcesUpdated', "", [
                'player_id' => $playerId,
                'leader_id' => $boardId,
                'resources' => $updatedResources
            ]);
        }
    }
}




