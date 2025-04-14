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
}
