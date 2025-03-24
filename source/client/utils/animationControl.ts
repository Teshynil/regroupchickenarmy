
export class AnimationControl {
    private animationQueue: { animation: DojoJS.Animation, resolve: () => void }[] = [];
    private isProcessingQueue: boolean = false;

    get isQueueEmpty(){
        return this.animationQueue.length === 0;
    }

    public enqueue(animation: DojoJS.Animation): Promise<void> {
        return new Promise((resolve) => {
            this.animationQueue.push({ animation, resolve });
            if (!this.isProcessingQueue) {
                this.processQueue();
            }
        });
    }

    private processQueue(): void {
        if (this.animationQueue.length === 0 || this.isProcessingQueue) {
            return;
        }

        this.isProcessingQueue = true;
        const { animation, resolve } = this.animationQueue.shift()!;

        animation.play();
        dojo.connect(animation, "onEnd", () => {
            resolve();
            this.isProcessingQueue = false;
            this.processQueue();
        });
    }
}