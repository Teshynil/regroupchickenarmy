<?php

namespace Bga\Games\RegroupChickenArmy\Components;

use Bga\Games\RegroupChickenArmy\Game;

class Players
{
    public static function getRemainingPlayers(Game $game)
    {
        return $game->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score`, `position` FROM `player` WHERE `player_score` > 0"
        );
    }


}
