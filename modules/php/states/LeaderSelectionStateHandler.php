<?php
namespace Bga\Games\RegroupChickenArmy\States;

use Bga\Games\RegroupChickenArmy\Game;
use BgaVisibleSystemException;

class LeaderSelectionStateHandler implements StateHandlerInterface {
    public static function handle(Game $game, string $action, ...$args): void {
        switch($action) {
            case 'selectLeader':
                self::selectLeader($game, ...$args);
                break;
            default:
                throw new BgaVisibleSystemException("Invalid action: $action");
        }
    }

    private static function selectLeader(Game $game, int $leaderId): void {
        $playerId = (int)$game->getActivePlayerId();
        
        if ($game->getUniqueValueFromDB("SELECT player_id FROM player WHERE position = $leaderId")) {
            $game->gamestate->nextState('notSelected');
            return;
        }

        $game->DbQuery("UPDATE player SET position = $leaderId WHERE player_id = $playerId");
        $game->notifyAllPlayers('leaderSelected', clienttranslate('${player_name} selected leader'), [
            'player_id' => $playerId,
            'leader_id' => $leaderId
        ]);

        $remaining = (int)$game->getUniqueValueFromDB("SELECT COUNT(*) FROM player WHERE position IS NULL");
        $game->gamestate->nextState($remaining ? 'selected' : 'allSelected');
    }

    public static function execute(Game $game): void {
        // Initialization logic for state entry
    }
}