export type NotifCallback<T extends keyof BGA.NotifTypes> = (args: BGA.Notif<T>["args"]) => Promise<void>;
export type BoardEventCallback<T extends keyof Game.BoardEventTypes> = (event: Game.BoardEventTypes[T]) => void;

export type ListenerConfig = {
    [K in keyof BGA.NotifTypes]?: {
        callback: NotifCallback<K>;
        isCustomEvent?: false;
    };
} & {
    [K in keyof Game.BoardEventTypes]?: {
        callback: BoardEventCallback<K>;
        isCustomEvent: true;
    };
};
