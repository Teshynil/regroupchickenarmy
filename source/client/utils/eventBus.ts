import { BoardEventCallback } from "./listenerElement";

export class EventBus {
    private static _instance: EventBus;
    private _listeners: Map<string, Map<string, Function>> = new Map();
    private _nextId: number = 1;

    static get instance(): EventBus {
        if (!EventBus._instance) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    }

    /**
     * Subscribe to an event
     * @param eventType The event type to subscribe to
     * @param callback The callback function to execute when event is emitted
     * @returns A subscription ID that can be used to unsubscribe
     */
    subscribe(eventType: keyof Game.BoardEventTypes, callback: BoardEventCallback<keyof Game.BoardEventTypes>): string {
        if (!this._listeners.has(eventType)) {
            this._listeners.set(eventType, new Map());
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
    unsubscribe(eventType: keyof Game.BoardEventTypes, subscriptionId: string): void {
        if (this._listeners.has(eventType)) {
            this._listeners.get(eventType)!.delete(subscriptionId);
        }
    }

    /**
     * Emit an event with data
     * @param eventType The event type to emit
     * @param detail The data to pass to subscribers
     */
    emit(eventType: keyof Game.BoardEventTypes, detail: Game.BoardEventTypes[keyof Game.BoardEventTypes]): void {
        if (this._listeners.has(eventType)) {
            this._listeners.get(eventType)!.forEach(callback => {
                callback(detail);
            });
        }
    }
}
