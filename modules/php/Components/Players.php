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


}
