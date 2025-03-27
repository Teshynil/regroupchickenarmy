import { RegroupChickenArmy } from "../regroupchickenarmy";
import { GameElement } from "./gameElement";
import { EventBus } from "./eventBus";

export type NotifCallback<T extends keyof BGA.NotifTypes> = (notif: BGA.Notif<T>) => void;
export type BoardEventCallback<T extends keyof Game.BoardEventTypes> = (event: Game.BoardEventTypes[T]) => void;

export type ListenerConfig = {
    // BGA notification listeners
    [K in keyof BGA.NotifTypes]?: {
        callback: NotifCallback<K>,
        isCustomEvent?: false
    }
} & {
    // Board DOM event listeners
    [K in keyof Game.BoardEventTypes]?: {
        callback: BoardEventCallback<K>,
        isCustomEvent: true
    }
};

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
            if (listener.isCustomEvent) {
                const boundCallback = listener.callback.bind(_this);
                // Store the subscription ID instead of the handle
                this._listenersHandlers[eventType as keyof ListenerConfig] =
                    EventBus.instance.subscribe(eventType as keyof Game.BoardEventTypes, boundCallback);
            } else {
                // Setup BGA notification listener (existing functionality)
                const boundCallback = listener.callback.bind(_this);
                this._listenersHandlers[eventType as keyof ListenerConfig] = RegroupChickenArmy.game.subscribeNotif(
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
                EventBus.instance.unsubscribe(eventType as keyof Game.BoardEventTypes, handle as string);
            } else {
                // For BGA notifications, handle is a DojoJS.Handle
                dojo.unsubscribe(handle as DojoJS.Handle);
            }
            this._listenersHandlers[eventType as keyof ListenerConfig] = undefined;
        }
    }

    unsubscribeAll(): void {
        Object.entries(this.listeners).forEach(([eventType, _listener]) => {
            this.unsubscribe(eventType);
        });
    }

    public override destroy() {
        this.unsubscribeAll();
        try {
            this.element.remove();
        } catch (error) { };
    }
}
