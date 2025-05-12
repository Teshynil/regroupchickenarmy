import { Animation, AnimationCallback } from "../animation";
import { Logger } from "../../core/logger";

export abstract class CommonAnimationBuilder {
    protected _id: string;
    protected _duration: number = 1000;
    protected _delay: number = 0;
    protected _waitFor?: string;
    protected _shouldEnqueue?: boolean = true;
    protected _waitForDuration: number = 3000;
    protected _beforeStartCallbacks: AnimationCallback[] = [];
    protected _afterEndCallbacks: AnimationCallback[] = [];

    protected constructor() { };

    static builder() {
        throw new Error("Not Expected");
    };

    public id(id: string): this {
        this._id = id;
        return this;
    }

    public duration(duration: number): this {
        this._duration = duration;
        return this;
    }

    public delay(delay: number): this {
        this._delay = delay;
        return this;
    }

    public waitFor(waitFor: string): this {
        this._waitFor = waitFor;
        return this;
    }

    public shouldEnqueue(shouldEnqueue: boolean): this {
        this._shouldEnqueue = shouldEnqueue;
        return this;
    }

    public waitForDuration(waitForDuration: number): this {
        this._waitForDuration = waitForDuration;
        return this;
    }

    public beforeStart(callback: AnimationCallback): this {
        this._beforeStartCallbacks.push(callback);
        return this;
    }

    public afterEnd(callback: AnimationCallback): this {
        this._afterEndCallbacks.push(callback);
        return this;
    }

    protected setupCallbacks(animation: Animation) {
        animation.beforeStartCallbacks.push(...this._beforeStartCallbacks);
        animation.afterEndCallbacks.push(...this._afterEndCallbacks);
        animation.shouldEnqueue = this._shouldEnqueue;
    }

    public build(): Animation {
        if (!this._id) {
            // If id is not provided, we generate a random one
            this._id = `animation_${Math.floor(Math.random() * 100000)}`;
            Logger.debug(`Animation id not provided, generated random one: ${this._id}`);
        }
        const animation = this._build();
        animation.duration = this._duration;
        animation.delay = this._delay;
        this.setupCallbacks(animation);
        return animation;
    }

    protected abstract _build(): Animation;
}