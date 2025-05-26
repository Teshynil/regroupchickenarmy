declare global {
    namespace Game {
        /**
         * Empty interface to be extended by the game
         */
        interface GameSpecificEventTypes {}

        /**
         * Empty interface to be extended by the game
         */
        interface GameSpecificSettings {}
    }
}
/**
 * Event callback type for BGA notifications, these should be defined in the game's .d.ts file
 */
export type NotifCallback<T extends keyof BGA.NotifTypes> = (args: BGA.Notif<T>['args']) => Promise<void>;

/**
 * Event callback type for custom board events, these should be defined in the game's .d.ts file
 */
export type GameEventCallback<T extends keyof GameEventTypes> = (event: GameEventTypes[T]) => void;

/**
 * Listener configuration type for both BGA notifications and custom board events, used in ListenerElement
 */
export type ListenerConfig = {
    [K in keyof BGA.NotifTypes]?: {
        callback: NotifCallback<K>;
        isCustomEvent?: false;
    };
} & {
    [K in keyof GameEventTypes]?: {
        callback: GameEventCallback<K>;
        isCustomEvent: true;
    };
};

/**
 * Base event types for the framework
 */
export interface CoreEventTypes {
    settingChanged: { key: keyof GameSettings; value: GameSettings[keyof GameSettings] };
}

/**
 * Base settings interface for the framework
 */
export interface CoreGameSettings {
    // This setting represents the multiplier for the duration of the animations
    // If 0 is set, animations are disabled, If 1 is set, animations are at normal speed
    // If 2 is set, animations are twice as slow, If 0.5 is set, animations are twice as fast, etc.
    animationSpeed?: number;
}

/**
 * Combined settings interface that merges base settings with game-specific settings
 * This should be extended in the game's .d.ts file, not here.
 */
export interface GameEventTypes extends CoreEventTypes, Game.GameSpecificEventTypes {}

/**
 * Combined settings interface that merges base settings with game-specific settings
 * This should be extended in the game's .d.ts file, not here.
 */
export interface GameSettings extends CoreGameSettings, Game.GameSpecificSettings {}
