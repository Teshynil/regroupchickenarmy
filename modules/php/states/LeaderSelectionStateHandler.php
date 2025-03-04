<?php

namespace Bga\Games\RegroupChickenArmy\States;

use Bga\Games\RegroupChickenArmy\Game;
use BgaUserException;
use BgaVisibleSystemException;

class LeaderSelectionStateHandler implements StateHandlerInterface
{
    public static function handle(Game $game, string $action, ...$args): void
    {
        switch ($action) {
            case 'selectLeader':
                self::selectLeader($game, ...$args);
                break;
            default:
                throw new BgaVisibleSystemException("Invalid action: $action");
        }
    }

    private static function selectLeader(Game $game, int $leaderId): void
    {
        $playerId = (int)$game->getActivePlayerId();

        if ($game->getUniqueValueFromDB("SELECT player_id FROM player WHERE position = $leaderId")) {
            $game->gamestate->nextState('notSelected');
            throw new BgaUserException("clienttranslate(That leader is already selected");
            
        }

        $game->DbQuery("UPDATE player SET position = $leaderId WHERE player_id = $playerId");
        $game->notifyAllPlayers('leaderSelected', clienttranslate('${player_name} selected leader'), [
            'player_name' => $game->getActivePlayerName(),
            'player_id' => $playerId,
            'leader_id' => $leaderId
        ]);

        $remaining = (int)$game->getUniqueValueFromDB("SELECT COUNT(*) FROM player WHERE position IS NULL");
        $game->gamestate->nextState($remaining ? 'selected' : 'allSelected');
    }

    public static function executeGameState(Game $game): void
    {
        $checkAllLeadersSelected = (int) $game->getUniqueValueFromDB(
            "SELECT COUNT(*) FROM `player` WHERE position is null"
        );
        $transition = "selectLeader";
        if ($checkAllLeadersSelected == 0) {
            $transition = "allSelectedLeader";
        }

        $currentPlayerId = $game->getCurrentPlayerId();
        $game->giveExtraTime($currentPlayerId);
        $player_id = $game->activeNextPlayer();
        $game->dump("nextPlayer", $player_id);
        $game->gamestate->nextState($transition);
    }
}
