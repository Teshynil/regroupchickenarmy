import { Animation } from "../animation";

export abstract class CommonAnimationBuilder {
    protected _id: string;
    protected _duration: number = 1000;
    protected _delay: number = 0;
    protected _waitFor?: string;
    protected _waitForDuration: number = 3000;

    protected constructor() { };

    static builder(){
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

    public waitForDuration(waitForDuration: number): this {
        this._waitForDuration = waitForDuration;
        return this;
    }

    abstract build(): Animation;
}