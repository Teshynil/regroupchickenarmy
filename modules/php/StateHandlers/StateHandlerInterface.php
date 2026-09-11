<?php
namespace Bga\Games\RegroupChickenArmy\StateHandlers;

use Bga\Games\RegroupChickenArmy\Game;

interface StateHandlerInterface {
    public static function handle(Game $game, string $action, ...$args): void;
    public static function executeGameState(Game $game): void;
}