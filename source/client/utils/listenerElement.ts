import { RegroupChickenArmy } from "../regroupchickenarmy";
import { GameElement } from "./gameElement";

export abstract class ListenerElement extends GameElement {
    abstract get listeners(): { [key: string]: { callback: Function, handle?: DojoJS.Handle } };

    constructor() {
        super();
        this.setupNotifications();
    }

    setupNotifications(): void {
        for (const [notifType, listener] of Object.entries(this.listeners)) {
            if (!listener.handle) {
                // Bind callback to retain `this` context and store the Dojo handle
                const boundCallback = listener.callback.bind(this);
                listener.handle = RegroupChickenArmy.game.subscribeNotif(
                    notifType as keyof BGA.NotifTypes,
                    boundCallback
                );
            }
        }
    }

    /** Unsubscribe a specific notification type */
    unsubscribe(notifType: string): void {
        const listener = this.listeners[notifType];
        if (listener?.handle) {
            dojo.unsubscribe(listener.handle);
            listener.handle = undefined; // Reset handle
        }
    }

    unsubscribeAll(): void {
        Object.entries(this.listeners).forEach(([notifType, _listener]) => {
            this.unsubscribe(notifType);
        });
    }
}