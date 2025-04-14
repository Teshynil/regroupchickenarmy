import { Animation } from "./animation";
import { logger } from "../logger";
import { SlideToObjectBuilder } from "./builders/slideToObjectBuilder";
import { SlideToObjectPosBuilder } from "./builders/slideToObjectPosBuilder";
import { SlideTemporaryObjectBuilder } from "./builders/slideTemporaryObject";

export class Animator {
    private static _instance: Animator | null = null;
    private animationQueue: { animation: Animation, resolve: () => void }[] = [];
    private runningAnimations: Map<string, Animation> = new Map();
    private isProcessingQueue: boolean = false;
    private waitingForDependencies: Map<string, { animation: Animation, resolve: () => void, timeoutId: number }> = new Map();

    private constructor() {}

    /**
     * Get the singleton instance of the AnimationControl
     */
    public static get instance(): Animator {
        if (!Animator._instance) {
            Animator._instance = new Animator();
        }
        return Animator._instance;
    }

    get isQueueEmpty() {
        return this.animationQueue.length === 0 && this.runningAnimations.size === 0 && this.waitingForDependencies.size === 0;
    }

    /**
     * Enqueue a Dojo animation with an identifier
     * @param id Unique identifier for this animation
     * @param dojoAnimation The Dojo animation object
     * @param waitFor Optional identifier of animation this one should wait for
     * @param waitForDuration Maximum time to wait for dependency in ms
     */
    public enqueueDojoAnimation(
        id: string, 
        dojoAnimation: DojoJS.Animation, 
        waitFor?: string, 
        waitForDuration: number = 3000
    ): Promise<void> {
        const animation = new Animation(id, dojoAnimation, waitFor, waitForDuration);
        return this.enqueue(animation);
    }

    /**
     * Enqueue an Animation object
     * @param animation The Animation object to enqueue
     */
    public enqueue(animation: Animation): Promise<void> {
        logger.debug(`Enqueuing animation: ${animation.id}`);
        
        return new Promise((resolve) => {
            // If this animation depends on another animation
            if (animation.waitFor) {
                const dependencyRunning = this.runningAnimations.has(animation.waitFor);
                const dependencyQueued = this.animationQueue.some(item => item.animation.id === animation.waitFor);
                
                if (dependencyRunning || dependencyQueued) {
                    logger.debug(`Animation ${animation.id} waiting for ${animation.waitFor}`);
                    
                    // Set a timeout in case the dependency takes too long
                    const timeoutId = setTimeout(() => {
                        logger.warn(`Timeout waiting for animation ${animation.waitFor}, proceeding with ${animation.id}`);
                        this.waitingForDependencies.delete(animation.id);
                        this.animationQueue.push({ animation, resolve });
                        this.processQueue();
                    }, animation.waitForDuration);
                    
                    // Store this animation as waiting for its dependency
                    this.waitingForDependencies.set(animation.id, { 
                        animation, 
                        resolve,
                        timeoutId 
                    });
                    return;
                }
                
                // If dependency doesn't exist, proceed normally
                logger.debug(`Dependency ${animation.waitFor} not found for ${animation.id}, proceeding`);
            }
            
            // Normal queue processing
            this.animationQueue.push({ animation, resolve });
            if (!this.isProcessingQueue) {
                this.processQueue();
            }
        });
    }

    /**
     * Check if an animation with the given ID is currently running
     * @param id The animation ID to check
     */
    public isAnimationRunning(id: string): boolean {
        return this.runningAnimations.has(id);
    }

    /**
     * Process the animation queue
     */
    private processQueue(): void {
        if (this.animationQueue.length === 0 || this.isProcessingQueue) {
            return;
        }

        this.isProcessingQueue = true;
        const { animation, resolve } = this.animationQueue.shift()!;
        
        logger.debug(`Playing animation: ${animation.id}`);
        
        // Mark this animation as running
        animation.isRunning = true;
        this.runningAnimations.set(animation.id, animation);

        animation.dojoAnimation.play();
        dojo.connect(animation.dojoAnimation, "onEnd", () => {
            logger.debug(`Animation completed: ${animation.id}`);
            
            // Mark as completed and remove from running
            animation.isCompleted = true;
            animation.isRunning = false;
            this.runningAnimations.delete(animation.id);
            
            // Check if any animations were waiting for this one
            this.checkWaitingDependencies(animation.id);
            
            resolve();
            this.isProcessingQueue = false;
            this.processQueue();
        });
    }

    /**
     * Check if any animations were waiting for the completed animation
     * @param completedAnimationId The ID of the completed animation
     */
    private checkWaitingDependencies(completedAnimationId: string): void {
        // Find all animations waiting for this one
        // Convert entries to array before destructuring for ES5 compatibility
        for (const entry of Array.from(this.waitingForDependencies.entries())) {
            const waitingId = entry[0];
            const { animation, resolve, timeoutId } = entry[1];
            if (animation.waitFor === completedAnimationId) {
                logger.debug(`Dependency ${completedAnimationId} completed, queueing ${waitingId}`);
                
                // Clear the timeout
                clearTimeout(timeoutId);
                
                // Remove from waiting and add to regular queue
                this.waitingForDependencies.delete(waitingId);
                this.animationQueue.push({ animation, resolve });
                
                // Process the queue if it's not already being processed
                if (!this.isProcessingQueue) {
                    this.processQueue();
                }
            }
        }
    }



    public static get slideToObject(): SlideToObjectBuilder {
        return SlideToObjectBuilder.builder();
    }

    public static get slideToObjectPos(): SlideToObjectPosBuilder {
        return SlideToObjectPosBuilder.builder();
    }

    public static get slideTemporaryObject(): SlideTemporaryObjectBuilder {
        return SlideTemporaryObjectBuilder.builder();
    }
}
