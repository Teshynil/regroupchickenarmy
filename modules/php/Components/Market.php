<?php

namespace Bga\Games\RegroupChickenArmy\Components;

use Bga\Games\RegroupChickenArmy\Game;

class Market
{
    public static function initializeMarket(Game $game): void
    {
        $game->trace("Initializing market with randomized cards");

        $game::DbQuery("INSERT INTO `market` (card_id)" .
            "SELECT card_id " .
            "FROM `cards` " .
            "WHERE card_id BETWEEN 1 AND 98 " .
            "ORDER BY RAND();");
    }

    public static function getMarketCard(Game $game, int $position)
    {
        $game->debug("Retrieving market card at position: $position");

        return $game->getUniqueValueFromDB(
            sprintf(
                "SELECT `card_id` FROM `market` ORDER BY `order` ASC LIMIT 1 OFFSET %s;",
                $position
            )
        );
    }

    public static function getAllMarketCards(Game $game)
    {
        $game->debug("Retrieving all available market cards");

        return $game->getObjectListFromDB(
            "SELECT `card_id`, `order` FROM `market` ORDER BY `order` ASC LIMIT 3"
        );
    }

    public static function hasEnoughCards(Game $game)
    {
        $game->trace("Checking if market has enough cards for all players");

        $remainingPlayers = count(Players::getRemainingPlayers($game));
        $game->debug("Need cards for $remainingPlayers remaining players");

        return $game->getUniqueValueFromDB(
            sprintf(
                "SELECT COUNT(*) >= %s AS has_enough_cards FROM `market`;",
                $remainingPlayers
            )
        );
    }

    public static function getCardsInDeck(Game $game)
    {
        $game->trace("Retrieving number of cards in deck");

        return $game->getUniqueValueFromDB(
            "SELECT COUNT(*) FROM `market` WHERE `order` > 3;"
        );
    }

    public static function removeMarketCard(Game $game, int $cardId): void
    {
        $game->trace("Removing card ID: $cardId from market");

        $game::DbQuery(
            sprintf(
                "DELETE FROM `market` WHERE `card_id` = %s;",
                $cardId
            )
        );
    }
}
