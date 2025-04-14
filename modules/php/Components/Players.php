<?php

namespace Bga\Games\RegroupChickenArmy\Components;

use Bga\Games\RegroupChickenArmy\Game;

class Players
{
    public static function getRemainingPlayers(Game $game)
    {
        $game->debug("Retrieving remaining players with assigned leaders");

        return $game->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score`, `leader_id` FROM `player` WHERE `leader_id` IS NOT NULL"
        );
    }

    /**
     * Initialize the first player for the game
     * Sets the first player based on natural order (player_no)
     */
    public static function initializeFirstPlayer(Game $game): int
    {
        $game->debug("Initializing first player");
        
        // Get the player with the lowest player_no
        $firstPlayerId = $game->getUniqueValueFromDB("SELECT player_id FROM player ORDER BY player_no ASC LIMIT 1");
        
        // Mark this player as the first player
        $game->DbQuery("UPDATE player SET is_first = 1 WHERE player_id = $firstPlayerId");
        $game->DbQuery("UPDATE player SET is_first = 0 WHERE player_id <> $firstPlayerId");
               
        $game->debug("First player set to ID: $firstPlayerId");
        
        return $firstPlayerId;
    }
    
    /**
     * Get the current first player ID
     */
    public static function getFirstPlayerId(Game $game): int
    {
        $firstPlayerId = $game->getUniqueValueFromDB("SELECT player_id FROM player WHERE is_first = 1");
        
        if (!$firstPlayerId) {
            // If no first player is set, initialize one
            $firstPlayerId = self::initializeFirstPlayer($game);
        }
        
        return $firstPlayerId;
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
        $currentPlayerNo = $game->getUniqueValueFromDB("SELECT player_no FROM player WHERE player_id = $currentFirstPlayerId");
        
        // Find the player with the next player_no (or wrap around to the lowest)
        $nextFirstPlayerId = $game->getUniqueValueFromDB(
            "SELECT player_id FROM player 
             WHERE player_no > $currentPlayerNo 
             ORDER BY player_no ASC LIMIT 1"
        );
        
        // If no player found (current player has highest player_no), wrap around to the lowest
        if (!$nextFirstPlayerId) {
            $nextFirstPlayerId = $game->getUniqueValueFromDB(
                "SELECT player_id FROM player ORDER BY player_no ASC LIMIT 1"
            );
        }
        
        // Update the first player
        $game->DbQuery("UPDATE player SET is_first = 0 WHERE player_id = $currentFirstPlayerId");
        $game->DbQuery("UPDATE player SET is_first = 1 WHERE player_id = $nextFirstPlayerId");
        
        // Update the game state value
        $game->setGameStateValue('firstPlayerId', $nextFirstPlayerId);
        
        $game->debug("First player rotated from ID: $currentFirstPlayerId to ID: $nextFirstPlayerId");
        
        return $nextFirstPlayerId;
    }
    
    /**
     * Get players in order starting from the first player
     */
    public static function getPlayersInOrder(Game $game): array
    {
        $game->debug("Getting players in order starting from first player");
        
        $firstPlayerId = self::getFirstPlayerId($game);
        $firstPlayerNo = $game->getUniqueValueFromDB("SELECT player_no FROM player WHERE player_id = $firstPlayerId");
        
        // Get all players ordered by player_no, starting from the first player
        $players = $game->getCollectionFromDB(
            "SELECT player_id, player_name, player_no, leader_id 
             FROM player 
             ORDER BY 
                CASE 
                    WHEN player_no >= $firstPlayerNo THEN 0 
                    ELSE 1 
                END, 
                player_no ASC"
        );
        
        $game->debug("Players in order: " . json_encode(array_keys($players)));
        
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

}
