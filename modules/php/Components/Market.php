<?php

namespace Bga\Games\RegroupChickenArmy\Components;

use Bga\Games\RegroupChickenArmy\Game;

class Market
{
    public static function initializeMarket(Game $game): void
    {
        $game::DbQuery("INSERT INTO `market` (card_id)" .
            "SELECT card_id " .
            "FROM `cards` " .
            "WHERE card_id < 99 " .
            "ORDER BY RAND();");
    }

    public static function getMarketCard(Game $game, int $position)
    {
        return $game::getUniqueValueFromDB(
            sprintf(
                "SELECT * FROM `market` ORDER BY `order` ASC LIMIT 1 OFFSET %s;",
                $position
            )
        );
    }

    public static function getAllMarketCards(Game $game)
    {
        return $game->getObjectListFromDB(
            "SELECT * FROM `market` ORDER BY `order` ASC LIMIT 3"
        );
    }

    public static function hasEnoughCards(Game $game)
    {
        $remainingPlayers = count(Players::getRemainingPlayers($game));
        return $game::getUniqueValueFromDB(
            sprintf(
                "SELECT COUNT(*) >= %s AS has_enough_cards FROM `market`;",
                $remainingPlayers
            )
        );
    }
}
