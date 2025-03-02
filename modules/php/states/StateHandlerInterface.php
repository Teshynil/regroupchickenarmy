<?php
namespace Bga\Games\RegroupChickenArmy\States;

use Bga\Games\RegroupChickenArmy\Game;

interface StateHandlerInterface {
    public static function handle(Game $game, string $action, ...$args): void;
    public static function execute(Game $game): void;
}