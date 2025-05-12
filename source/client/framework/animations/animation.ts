export type ElementOrId = string | HTMLElement;
export type AnimationCallback = (element: HTMLElement, animation?: Animation) => void;

export class Animation {
    public id: string;
    public element: ElementOrId;
    public dojoAnimation: DojoJS.Animation;
    public debugData: object = {}; // Optional debug data for logging purposes
    public duration: number;
    public delay: number;
    public shouldEnqueue: boolean = true;
    public waitFor?: string;
    public waitForDuration: number = 3000; // Default timeout in ms
    public isRunning: boolean = false;
    public isCompleted: boolean = false;
    public beforeStartCallbacks: AnimationCallback[] = [];
    public afterEndCallbacks: AnimationCallback[] = [];

    /**
     * Creates a new Animation wrapper
     * @param id Unique identifier for this animation
     * @param element The element to animate
     * @param animation The Dojo animation object
     * @param waitFor Optional identifier of animation this one should wait for
     * @param waitForDuration Maximum time to wait for dependency in ms
     */
    constructor(
        id: string,
        element: ElementOrId,
        animation: DojoJS.Animation,
        waitFor?: string,
        waitForDuration: number = 3000
    ) {
        this.id = id;
        this.element = element;
        this.dojoAnimation = animation;
        this.waitFor = waitFor;
        this.waitForDuration = waitForDuration;
    }
}
