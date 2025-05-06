import { GameElement } from "./gameElement";
import { GameEventBus } from "../core/gameEventBus";
import { Logger } from "../core/logger";
import { NotifCallback, BoardEventCallback, ListenerConfig } from "../core/types";
import { BGAEventBus } from "../core/bgaEventBus";

export abstract class ListenerElement extends GameElement {
    abstract get listeners(): ListenerConfig;

    private _listenersHandlers: { [key in keyof ListenerConfig]?: string | DojoJS.Handle } = {};

    public override render(force?: boolean): this {
        super.render(force);
        this.setupNotifications();
        return this;
    }

    setupNotifications(): void {
        const _this = this;
        for (const [eventType, listener] of Object.entries(this.listeners)) {
            // Check if the listener has a Handler already
            if (this._listenersHandlers[eventType as keyof ListenerConfig]) {
                continue;
            }
            if (listener.isCustomEvent) {
                const boundCallback = listener.callback.bind(_this);
                const boardEventType = eventType as keyof Game.BoardEventTypes;
                // Store the subscription ID instead of the handle
                this._listenersHandlers[boardEventType] =
                    GameEventBus.instance.subscribe(
                        boardEventType,
                        boundCallback as BoardEventCallback<typeof boardEventType>
                    );
            } else {
                // Setup BGA notification listener (existing functionality)
                const callback = listener.callback as NotifCallback<keyof BGA.NotifTypes>;
                const boundCallback = (args: BGA.Notif<keyof BGA.NotifTypes>["args"]): Promise<void> => {
                    return callback.call(this, args);
                };
                this._listenersHandlers[eventType as keyof ListenerConfig] =
                    BGAEventBus.instance.subscribe(
                        eventType as keyof BGA.NotifTypes,
                        boundCallback as NotifCallback<keyof BGA.NotifTypes>
                    );
            }
        }
    }

    /** Unsubscribe a specific notification or event type */
    unsubscribe(eventType: string): void {
        const listener = this.listeners[eventType as keyof ListenerConfig];
        const handle = this._listenersHandlers[eventType as keyof ListenerConfig];

        if (handle) {
            if (listener.isCustomEvent) {
                // For custom events, handle is a string subscription ID
                GameEventBus.instance.unsubscribe(eventType as keyof Game.BoardEventTypes, handle as string);
            } else {
                // For BGA notifications, handle is a DojoJS.Handle
                BGAEventBus.instance.unsubscribe(eventType as keyof BGA.NotifTypes, handle as string);
            }
            this._listenersHandlers[eventType as keyof ListenerConfig] = undefined;
        }
    }

    unsubscribeAll(): void {
        Object.entries(this.listeners).forEach(([eventType, _listener]) => {
            this.unsubscribe(eventType);
        });
    }

    public override afterDestroy() {
        this.unsubscribeAll();
    }
}
