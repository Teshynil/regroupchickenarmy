<?php

namespace Bga\Games\RegroupChickenArmy\Components;

use Bga\Games\RegroupChickenArmy\Game;

class Players
{

    public const LEADER_COLORS = [
        0 => "ffa500",
        1 => "0000ff",
        2 => "ff0000",
        3 => "008000",
    ];

    public const LEADER_ORDER = [
        //This is the order of the leaders in the client clockwise starting from the top left
        /*
        [leader_0][leader_1]
        [leader_2][leader_3]
        */
        0 => 0, //Leader 0 is the first leader in the client
        1 => 1, //Leader 1 is the second leader in the client
        2 => 3, //Leader 2 is the fourth leader in the client
        3 => 2, //Leader 3 is the third leader in the client
    ];


    public static function getRemainingPlayers(Game $game)
    {
        $game->debug("Retrieving remaining players with assigned leaders");

        return $game->getCollectionFromDb(
            "SELECT p.`player_id` `id`, p.`player_score` `score`, pd.`leader_id`
             FROM `player` p
             JOIN `playerData` pd ON p.`player_id` = pd.`player_id`
             ORDER BY pd.`leader_id` ASC"
        );
    }

    /**
     * Initialize the first player for the game.
     * Sets the first player randomly and returns the ID of the first player.
     */
    public static function initializeFirstPlayer(Game $game): int
    {
        $game->debug("Initializing first player");

        // Get a random player
        $firstPlayerId = $game->getUniqueValueFromDB(
            "SELECT p.player_id FROM player p JOIN playerData pd ON p.player_id = pd.player_id ORDER BY RAND() LIMIT 1"
        );

        // Mark this player as the first player
        $game->DbQuery("UPDATE playerData SET is_first = 1 WHERE player_id = $firstPlayerId");
        $game->DbQuery("UPDATE playerData SET is_first = 0 WHERE player_id <> $firstPlayerId");

        $game->debug("First player set to ID: $firstPlayerId");

        return $firstPlayerId;
    }

    /**
     * Get the current first player ID
     */
    public static function getFirstPlayerId(Game $game): int
    {
        $firstPlayerId = $game->getUniqueValueFromDB("SELECT player_id FROM playerData WHERE is_first = 1");

        if (!$firstPlayerId) {
            // If no first player is set, initialize one
            $firstPlayerId = self::initializeFirstPlayer($game);
        }

        return $firstPlayerId;
    }

    public static function getPlayerId(Game $game, int $leaderId): int
    {
        return $game->getUniqueValueFromDB("SELECT player_id FROM playerData WHERE leader_id = $leaderId");
    }

    /**
     * Rotate the first player to the next player in natural order
     * Returns the ID of the new first player
     */
    public static function rotateFirstPlayer(Game $game): int
    {
        $game->debug("Rotating first player for next round");

        // Get current first player
        $currentFirstPlayerId = self::getFirstPlayerId($game);

        $nextFirstPlayerId = self::getNextPlayerId($game, $currentFirstPlayerId);
        $game->debug("Next first player ID: $nextFirstPlayerId");

        // Update the first player
        $game->DbQuery("UPDATE playerData SET is_first = 0 WHERE player_id = $currentFirstPlayerId");
        $game->DbQuery("UPDATE playerData SET is_first = 1 WHERE player_id = $nextFirstPlayerId");

        $game->debug("First player rotated from ID: $currentFirstPlayerId to ID: $nextFirstPlayerId");

        return $nextFirstPlayerId;
    }

    private static function getNextPlayerId(Game $game, int $currentPlayerId): int
    {
        $game->debug("Getting next player ID from player ID: $currentPlayerId");

        $currentOrderId = $game->getUniqueValueFromDB("SELECT order_id FROM playerData WHERE player_id = $currentPlayerId");

        $game->debug("Current player order ID: $currentOrderId");

        $nextPlayerId = $game->getUniqueValueFromDB(
            "SELECT player_id FROM playerData
             WHERE order_id > $currentOrderId
             AND is_dead = 0 
             ORDER BY order_id ASC LIMIT 1"
        );

        $game->debug("Next player ID: $nextPlayerId");

        if (!$nextPlayerId) {
            $nextPlayerId = $game->getUniqueValueFromDB(
                "SELECT player_id FROM playerData
                WHERE is_dead = 0
                ORDER BY order_id ASC LIMIT 1"
            );
        }

        return $nextPlayerId;
    }

    /**
     * Get players ordered by their leader_id (from lowest to highest)
     */
    public static function getPlayersByLeaderId(Game $game): array
    {
        $game->debug("Getting players ordered by leader_id");

        // Get all players with assigned leaders, ordered by leader_id
        $players = $game->getCollectionFromDB(
            "SELECT p.player_id, p.player_name, p.player_no, pd.leader_id
             FROM player p
             JOIN playerData pd ON p.player_id = pd.player_id
             ORDER BY pd.leader_id ASC"
        );

        $game->debug("Players by leader_id: " . json_encode(array_keys($players)));

        return $players;
    }

    /**
     * Activate the first player of the round
     */
    public static function activateFirstPlayer(Game $game): void
    {
        $firstPlayerId = self::getFirstPlayerId($game);
        $game->gamestate->changeActivePlayer($firstPlayerId);
        $game->debug("Activated first player ID: $firstPlayerId");
    }

    public static function activateNextPlayer(Game $game): int
    {
        $currentPlayerId = $game->getCurrentPlayerId();
        $game->giveExtraTime($currentPlayerId);
        $game->debug("Giving extra time to player ID: $currentPlayerId");
        $nextPlayerId = self::getNextPlayerId($game, $currentPlayerId);
        $game->gamestate->changeActivePlayer($nextPlayerId);
        $game->debug("Activated next player ID: $nextPlayerId");
        return $nextPlayerId;
    }

    public static function assignPlayerToLeader(Game $game, int $playerId, int $leaderId): void
    {
        $game->DbQuery("UPDATE playerData SET leader_id = $leaderId WHERE player_id = $playerId");
        //Set the order_id of the player to the order of the leader in the client clockwise starting from the top left. This is used to determine the order of the players in the game.
        $game->DbQuery("UPDATE playerData SET order_id = " . self::LEADER_ORDER[$leaderId] . " WHERE player_id = $playerId");
        $game->debug("Assigned player ID: $playerId to leader ID: $leaderId");

        $playerColor = self::LEADER_COLORS[$leaderId];
        $game->DbQuery("UPDATE player SET player_color = '$playerColor' WHERE player_id = $playerId");
        $game->debug("Assigned player color: $playerColor to player ID: $playerId");
    }
}
