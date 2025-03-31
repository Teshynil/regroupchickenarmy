<?php

namespace Bga\Games\RegroupChickenArmy\Components;

use Bga\Games\RegroupChickenArmy\Game;
use BgaUserException;

class Boards
{
    const GRID_SIZE = 14;
    const EMPTY_SLOT = 'NN';

    public static function initializeBoard(Game $game, int $boardId): void
    {
        $grid = array_fill(0, self::GRID_SIZE, array_fill(0, self::GRID_SIZE, self::EMPTY_SLOT));
        $gridJson = json_encode($grid);

        $game->DbQuery("INSERT INTO `boards` (`board_id`, `grid`) VALUES ($boardId, '$gridJson')");
    }

    public static function putCardOnBoard(Game $game, int $boardId, int $cardId, int $rotation, int $posX, int $posY, bool $notify = true): void
    {
        // Check if position is valid
        if (!self::isValidPlacement($game, $boardId, $posX, $posY)) {
            throw new BgaUserException(clienttranslate("Invalid position for card placement"));
        }

        // Add board move record
        $game->DbQuery("INSERT INTO `boards_moves` (`board_id`, `card_id`, `rotation`, `x`, `y`) 
                        VALUES ($boardId, $cardId, $rotation, $posX, $posY)");

        // Update board grid
        self::updateBoardGrid($game, $boardId, $cardId, $rotation, $posX, $posY);

        // Notify players
        if ($notify) {
            $game->notifyAllPlayers('cardPlaced', clienttranslate('${player_name} placed a card'), [
                'player_name' => $game->getActivePlayerName(),
                'player_id' => $game->getActivePlayerId(),
                'board_id' => $boardId,
                'card_id' => $cardId,
                'rotation' => $rotation,
                'x' => $posX,
                'y' => $posY
            ]);
        }
    }

    private static function isValidPlacement(Game $game, int $boardId, int $posX, int $posY): bool
    {
        // Check boundaries
        if ($posX < 0 || $posY < 0 || $posX > self::GRID_SIZE - 2 || $posY > self::GRID_SIZE - 2) {
            return false;
        }
        $grid = self::getBoardGrid($game, $boardId);
        $game->dump("grid", $boardId);
        $boardMoves = self::getBoardMoves($game, $boardId);
        $isFirstCard = count($boardMoves) == 0;
        if ($isFirstCard) {
            //The first card should be only in the center of the board
            if ($posX != 6 || $posY != 6) {
                return false;
            }
            return true;
        }

        // Check if the card connects to at least one existing card
        for ($y = $posY; $y <= $posY + 1; $y++) {
            for ($x = $posX; $x <= $posX + 1; $x++) {
                $game->dump("coord", "$y,$x");
                if ($x < 0 || $y < 0 || $x >= self::GRID_SIZE || $y >= self::GRID_SIZE) {
                    continue;
                }
                $game->dump("cell", $grid[$y][$x]);

                if ($grid[$y][$x] != self::EMPTY_SLOT) {
                    return true;
                }
            }
        }

        return false;
    }

    private static function updateBoardGrid(Game $game, int $boardId, int $cardId, int $rotation, int $posX, int $posY): void
    {
        $grid = self::getBoardGrid($game, $boardId);
        $cardSlots = self::getCardSlots($game, $cardId, $rotation);

        // Update grid with card slots
        $grid[$posY][$posX] = $cardSlots[0];
        $grid[$posY][$posX + 1] = $cardSlots[1];
        $grid[$posY + 1][$posX] = $cardSlots[2];
        $grid[$posY + 1][$posX + 1] = $cardSlots[3];

        // Save updated grid
        $gridJson = json_encode($grid);
        $game->DbQuery("UPDATE `boards` SET `grid` = '$gridJson' WHERE `board_id` = $boardId");
    }

    public static function getBoardGrid(Game $game, int $boardId): array
    {
        $gridJson = $game->getUniqueValueFromDB("SELECT `grid` FROM `boards` WHERE `board_id` = $boardId");
        if ($gridJson === null) {
            throw new \BgaVisibleSystemException("Board grid not found for board ID: $boardId");
        }
        $grid = json_decode($gridJson, true);
        if ($grid === null) {
            throw new \BgaVisibleSystemException("Failed to decode board grid for board ID: $boardId");
        }
        return $grid;
    }

    private static function getCardSlots(Game $game, int $cardId, int $rotation): array
    {
        $cardData = $game->getObjectFromDB("SELECT `s1`, `s2`, `s3`, `s4` FROM `cards` WHERE `card_id` = $cardId");
        $slots = [$cardData['s1'], $cardData['s2'], $cardData['s3'], $cardData['s4']];

        $effectiveRotation = (($rotation % 4) + 4) % 4;

        switch ($effectiveRotation) {
            case 0:
                return [
                    $slots[0],
                    $slots[1],
                    $slots[2],
                    $slots[3]
                ];
            case 1:
                return [
                    $slots[2],
                    $slots[0],
                    $slots[3],
                    $slots[1]
                ];
            case 2:
                return [
                    $slots[3],
                    $slots[2],
                    $slots[1],
                    $slots[0]
                ];
            case 3:
                return [
                    $slots[1],
                    $slots[3],
                    $slots[0],
                    $slots[2]
                ];
            default:
                throw new \BgaVisibleSystemException("Invalid rotation: $effectiveRotation");
        }
    }

    public static function initializeAllBoards(Game $game): void
    {
        $players = Players::getRemainingPlayers($game);

        foreach ($players as $playerId => $player) {
            $leaderId = $player['leader_id'];
            if ($leaderId) {
                self::initializeBoard($game, $leaderId);
            }
        }
    }

    public static function getBoardMoves(Game $game, int $boardId = null): array
    {
        $sql = "SELECT `board_id`, `card_id`, `rotation`, `x`, `y` FROM `boards_moves`";

        if ($boardId !== null) {
            $sql .= " WHERE `board_id` = $boardId";
        }

        $sql .= " ORDER BY `movement_id` ASC";

        return $game->getCollectionFromDb($sql);
    }
}
