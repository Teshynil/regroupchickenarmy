import { Animator } from "./animator";
import { logger } from "../logger";

export type ElementOrId = string | HTMLElement;

export class Animation {
    public id: string;
    public dojoAnimation: DojoJS.Animation;
    public debugData: object = {}; // Optional debug data for logging purposes
    public duration: number;
    public delay: number;
    public waitFor?: string;
    public waitForDuration: number = 3000; // Default timeout in ms
    public isRunning: boolean = false;
    public isCompleted: boolean = false;
    public beforeStart?: () => void;
    public afterEnd?: () => void;

    /**
     * Creates a new Animation wrapper
     * @param id Unique identifier for this animation
     * @param animation The Dojo animation object
     * @param waitFor Optional identifier of animation this one should wait for
     * @param waitForDuration Maximum time to wait for dependency in ms
     */
    constructor(
        id: string,
        animation: DojoJS.Animation,
        waitFor?: string,
        waitForDuration: number = 3000
    ) {
        this.id = id;
        this.dojoAnimation = animation;
        this.waitFor = waitFor;
        this.waitForDuration = waitForDuration;
    }

    /**
     * Plays the animation through the animation control system
     * Returns a promise that resolves when the animation completes
     */
    public play(): Promise<void> {
        // If beforeStart is defined, call it before enqueueing
        if (this.beforeStart) {
            this.beforeStart();
        }

        // Connect afterEnd to the animation's onEnd event
        if (this.afterEnd) {
            dojo.connect(this.dojoAnimation, "onEnd", () => {
                this.afterEnd();
            });
        }

        return Animator.instance.enqueue(this);
    }

    public logDebugData() {
        logger.debug(`[ANIMATION]: ${JSON.stringify(this.debugData, null, 2)}`);
    }
}
