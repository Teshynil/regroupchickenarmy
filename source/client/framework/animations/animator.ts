import { Animation } from './animation';
import { Logger } from '../../framework/core/logger';
import { SlideToObjectBuilder } from './builders/slideToObjectBuilder';
import { SlideToObjectPosBuilder } from './builders/slideToObjectPosBuilder';
import { SlideTemporaryObjectBuilder } from './builders/slideTemporaryObject';
import { CssAnimationBuilder } from './builders/cssAnimation';

export class Animator {
    private static _instance: Animator | null = null;
    private animationQueue: { animation: Animation; resolve: () => void }[] = [];
    private runningAnimations: Map<string, Animation> = new Map();
    private isProcessingQueue: boolean = false;
    private waitingForDependencies: Map<string, { animation: Animation; resolve: () => void; timeoutId: number }> =
        new Map();
    private animationTimeouts: Map<string, number> = new Map();
    public fastforwardAnimations: boolean = false;
    private static DEFAULT_TIMEOUT_BUFFER: number = 300;
    public static readonly FAST_FORWARD_MULTIPLIER = 4;
    public static readonly FAST_FORWARD_MINIMUM_DURATION = 250;

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
        return (
            this.animationQueue.length === 0 &&
            this.runningAnimations.size === 0 &&
            this.waitingForDependencies.size === 0
        );
    }

    /**
     * Enqueue an Animation object
     * @param animation The Animation object to enqueue
     */
    public enqueue(animation: Animation): Promise<void> {
        Logger.debug(`Enqueuing animation: ${animation.id}`);

        return new Promise((resolve) => {
            if (!animation.shouldEnqueue) {
                Logger.debug(`Skipping queue for animation: ${animation.id}`);
                this.processAsyncAnimation(animation, resolve, false);
                return;
            }

            // If this animation depends on another animation
            if (animation.waitFor) {
                const dependencyRunning = this.runningAnimations.has(animation.waitFor);
                const dependencyQueued = this.animationQueue.some((item) => item.animation.id === animation.waitFor);

                if (dependencyRunning || dependencyQueued) {
                    Logger.debug(`Animation ${animation.id} waiting for ${animation.waitFor}`);

                    // Set a timeout in case the dependency takes too long
                    const timeoutId = setTimeout(() => {
                        Logger.warn(
                            `Timeout waiting for animation ${animation.waitFor}, proceeding with ${animation.id}`,
                        );
                        this.waitingForDependencies.delete(animation.id);
                        this.animationQueue.push({ animation, resolve });
                        this.processQueue();
                    }, animation.waitForDuration);

                    // Store this animation as waiting for its dependency
                    this.waitingForDependencies.set(animation.id, {
                        animation,
                        resolve,
                        timeoutId,
                    });
                    return;
                }

                // If dependency doesn't exist, proceed normally
                Logger.debug(`Dependency ${animation.waitFor} not found for ${animation.id}, proceeding`);
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
     * Force complete an animation that has timed out
     * @param animationId The ID of the animation to force complete
     */
    private forceCompleteAnimation(animationId: string): void {
        const animation = this.runningAnimations.get(animationId);
        if (!animation) {
            return;
        }

        Logger.warn(`Animation ${animationId} timed out, forcing completion`);

        // Try to stop the animation if it's still running
        try {
            animation.dojoAnimation.stop();
        } catch (error) {
            Logger.error(`Error stopping animation ${animationId}:`, error);
        }

        // Mark as completed and remove from running
        animation.isCompleted = true;
        animation.isRunning = false;
        this.runningAnimations.delete(animationId);

        // Clear the timeout
        if (this.animationTimeouts.has(animationId)) {
            clearTimeout(this.animationTimeouts.get(animationId));
            this.animationTimeouts.delete(animationId);
        }

        // Check if any animations were waiting for this one
        this.checkWaitingDependencies(animationId);

        // Continue processing the queue
        this.isProcessingQueue = false;
        this.processQueue();
    }

    private processAsyncAnimation(animation: Animation, resolve: () => void, shouldContinueQueue = true): void {
        Logger.debug(`Playing animation: ${animation.id}`);

        if (this.fastforwardAnimations) {
            animation.duration = Math.max(
                Animator.FAST_FORWARD_MINIMUM_DURATION,
                Math.floor(animation.duration / Animator.FAST_FORWARD_MULTIPLIER),
            );
            animation.delay = Math.max(
                Animator.FAST_FORWARD_MINIMUM_DURATION,
                Math.floor(animation.duration / Animator.FAST_FORWARD_MULTIPLIER),
            );
            animation.dojoAnimation.duration = animation.duration;
            animation.dojoAnimation.delay = animation.delay;
        }
        // Mark this animation as running
        animation.isRunning = true;
        this.runningAnimations.set(animation.id, animation);

        // Set a timeout for this animation
        const timeoutDuration = animation.duration + animation.delay + Animator.DEFAULT_TIMEOUT_BUFFER;
        const timeoutId = setTimeout(() => {
            Logger.warn(`Animation ${animation.id} timeout after ${timeoutDuration}ms`);

            // Execute all afterEnd callbacks before resolving
            const element = Animator.resolveElement(animation);
            if (element) {
                for (const callback of animation.afterEndCallbacks) {
                    try {
                        callback(element, animation);
                    } catch (error) {
                        Logger.error(
                            `Error executing afterEnd callback for timed out animation ${animation.id}:`,
                            error,
                        );
                    }
                }
            }

            // Force complete the animation
            this.forceCompleteAnimation(animation.id);

            // Resolve the promise
            resolve();
        }, timeoutDuration);

        this.animationTimeouts.set(animation.id, timeoutId);

        animation.dojoAnimation.play();
        dojo.connect(animation.dojoAnimation, 'onEnd', () => {
            Logger.debug(`Animation completed: ${animation.id}`);

            // Clear the timeout since animation completed normally
            if (this.animationTimeouts.has(animation.id)) {
                clearTimeout(this.animationTimeouts.get(animation.id));
                this.animationTimeouts.delete(animation.id);
            }

            // Mark as completed and remove from running
            animation.isCompleted = true;
            animation.isRunning = false;
            this.runningAnimations.delete(animation.id);

            // Check if any animations were waiting for this one
            this.checkWaitingDependencies(animation.id);

            resolve();
            if (shouldContinueQueue) {
                this.isProcessingQueue = false;
                this.processQueue();
            }
        });
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

        this.processAsyncAnimation(animation, resolve);
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
                Logger.debug(`Dependency ${completedAnimationId} completed, queueing ${waitingId}`);

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

    public static get cssAnimation(): CssAnimationBuilder {
        return CssAnimationBuilder.builder();
    }

    private static resolveElement(animation: Animation): HTMLElement | null {
        if (typeof animation.element === 'string') {
            const element = document.getElementById(animation.element);
            if (!element) {
                Logger.error(`Failed to find element with id ${animation.element} for animation ${animation.id}.`);
                return null;
            }
            return element;
        } else {
            return animation.element;
        }
    }

    /**
     * Plays the animation through the animation control system
     * Returns a promise that resolves when the animation completes
     */
    public static play(animation: Animation): Promise<void> {
        const element = Animator.resolveElement(animation);
        if (!element) {
            Logger.error(`Failed to find element for animation ${animation.id}. Skipping.`);
            return Promise.resolve();
        }

        // Connect all beforeStart callbacks to the animation's onBegin event
        for (const callback of animation.beforeStartCallbacks) {
            dojo.connect(animation.dojoAnimation, 'onBegin', () => {
                try {
                    callback(element, animation);
                } catch (error) {
                    Logger.error(`Error executing beforeStart callback for animation ${animation.id}:`, error);
                }
            });
        }

        // Connect all afterEnd callbacks to the animation's onEnd event
        for (const callback of animation.afterEndCallbacks) {
            dojo.connect(animation.dojoAnimation, 'onEnd', () => {
                try {
                    callback(element, animation);
                } catch (error) {
                    Logger.error(`Error executing afterEnd callback for animation ${animation.id}:`, error);
                }
            });
        }

        return Animator.instance.enqueue(animation);
    }
}
