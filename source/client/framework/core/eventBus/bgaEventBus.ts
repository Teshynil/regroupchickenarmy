import { NotifCallback } from '../../types';
import dojo = require('dojo');
import { Logger } from '../logger';

export class BGAEventBus {
    private static _instance: BGAEventBus;
    private _listeners: Map<string, Map<string, NotifCallback<keyof BGA.NotifTypes>>> = new Map();
    private _nextId: number = 1;

    static get instance(): BGAEventBus {
        if (!BGAEventBus._instance) {
            BGAEventBus._instance = new BGAEventBus();
        }
        return BGAEventBus._instance;
    }

    handleNotification(eventType: keyof BGA.NotifTypes, notif: BGA.Notif<keyof BGA.NotifTypes>) {
        Logger.info(`Entering Notification ${eventType}`);
        Logger.debug(`Notification ${eventType} args: `, notif.args);
        const minDuration = 500;
        const minDurationNoText = 1;
        const formattedMessage = gameui.format_string_recursive(notif.log, notif.args);
        const additionalWait = formattedMessage !== '' ? minDuration : minDurationNoText;

        const promiseList: Promise<void>[] = [];
        if (this._listeners.has(eventType)) {
            this._listeners.get(eventType)!.forEach((callback) => {
                promiseList.push(callback(notif.args));
            });
        } else {
            Logger.info(`No listeners for notification ${eventType}`);
        }

        gameui.bgaAnimationsActive() ? promiseList.push(gameui.wait(additionalWait)) : null;
        Promise.all(promiseList).then(() => {
            Logger.info(`Exiting Notification ${eventType}`);
            gameui.notifqueue.onSynchronousNotificationEnd();
        });
    }

    /**
     * Subscribe to an event
     * @param eventType The event type to subscribe to
     * @param callback The callback function to execute when event is emitted
     * @returns A subscription ID that can be used to unsubscribe
     */
    subscribe(eventType: keyof BGA.NotifTypes, callback: NotifCallback<keyof BGA.NotifTypes>): string {
        if (!this._listeners.has(eventType)) {
            this._listeners.set(eventType, new Map());
            dojo.subscribe(eventType, gameui, this.handleNotification.bind(this, eventType));
            gameui.notifqueue.setSynchronous(eventType, undefined);
        }

        const subscriptionId = `sub_${this._nextId++}`;
        this._listeners.get(eventType)!.set(subscriptionId, callback);

        return subscriptionId;
    }

    /**
     * Unsubscribe from an event using the subscription ID
     * @param eventType The event type to unsubscribe from
     * @param subscriptionId The subscription ID returned from subscribe
     */
    unsubscribe(eventType: keyof BGA.NotifTypes, subscriptionId: string): void {
        if (this._listeners.has(eventType)) {
            this._listeners.get(eventType)!.delete(subscriptionId);
        }
    }
}
