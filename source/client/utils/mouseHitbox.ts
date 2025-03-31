import { EventBus } from "./eventBus";

export class MouseHitbox {
    private static _instance: MouseHitbox | null = null;
    private hitboxElement: HTMLDivElement | null = null;
    private hitboxId: number = 0;
    private elementsToCollideWith: HTMLElement[] = [];
    private currentCollisions: HTMLElement[] = [];
    private highlightCollisionables: boolean = false;
    private mouseMoveListener: (e: MouseEvent) => void;
    private hitboxSize: number = 0;
    private sessionActive: boolean = false;

    private constructor() {
        this.mouseMoveListener = this.onMouseMove.bind(this);
    }

    static get instance(): MouseHitbox {
        if (!MouseHitbox._instance) {
            MouseHitbox._instance = new MouseHitbox();
        }
        return MouseHitbox._instance;
    }

    /**
     * Starts a mouse hitbox session
     * @param hitboxSize Size of the hitbox in pixels
     * @param elementsToCollideWith Array of elements to check for collisions
     */
    public startSession(id: number, hitboxSize: number, elementsToCollideWith: HTMLElement[], highlightCollisionables: boolean = false): void {
        if (this.sessionActive) {
            this.stopSession();
        }

        this.sessionActive = true;
        this.hitboxId = id;
        this.hitboxSize = hitboxSize;
        this.elementsToCollideWith = elementsToCollideWith;
        this.highlightCollisionables = highlightCollisionables;
        if (highlightCollisionables) {
            this.elementsToCollideWith.forEach(e => {
                e.classList.add("highlight");
            })
        }
        this.currentCollisions = [];

        this.createHitboxElement();
        document.addEventListener('mousemove', this.mouseMoveListener);
    }

    /**
     * Stops the current hitbox session
     */
    public stopSession(): void {
        if (!this.sessionActive) return;

        document.removeEventListener('mousemove', this.mouseMoveListener);
        this.removeHitboxElement();

        if (this.highlightCollisionables) {
            this.elementsToCollideWith.forEach(e => {
                e.classList.remove("highlight");
            })
        }
        this.sessionActive = false;
        this.elementsToCollideWith = [];
        this.currentCollisions = [];
    }

    /**
     * Creates the hitbox element and adds it to the body
     */
    private createHitboxElement(): void {
        this.hitboxElement = document.createElement('div');
        this.hitboxElement.id = 'mouseHitbox';

        Object.assign(this.hitboxElement.style, {
            position: 'fixed',
            width: `${this.hitboxSize}px`,
            height: `${this.hitboxSize}px`,
            pointerEvents: 'none',
            zIndex: '900',
            opacity: '0',
            transform: 'translate(-50%, -50%)',
            border: '1px dashed rgba(255, 0, 0, 0.5)',
            backgroundColor: 'rgba(255, 0, 0, 0.1)'
        });

        document.body.appendChild(this.hitboxElement);
    }

    /**
     * Removes the hitbox element from the DOM
     */
    private removeHitboxElement(): void {
        if (this.hitboxElement && this.hitboxElement.parentNode) {
            this.hitboxElement.parentNode.removeChild(this.hitboxElement);
            this.hitboxElement = null;
        }
    }

    /**
     * Handles mouse movement and updates hitbox position
     */
    private onMouseMove(e: MouseEvent): void {
        if (!this.hitboxElement || !this.sessionActive) return;

        this.hitboxElement.style.left = `${e.clientX}px`;
        this.hitboxElement.style.top = `${e.clientY}px`;

        this.detectCollisions();
    }

    /**
     * Detects collisions between the hitbox and the elements to collide with
     */
    private detectCollisions(): void {
        if (!this.hitboxElement || !this.sessionActive) return;

        const hitboxRect = this.hitboxElement.getBoundingClientRect();
        const newCollisions: HTMLElement[] = [];

        this.elementsToCollideWith.forEach(element => {
            const elementRect = element.getBoundingClientRect();

            if (
                hitboxRect.left < elementRect.right &&
                hitboxRect.right > elementRect.left &&
                hitboxRect.top < elementRect.bottom &&
                hitboxRect.bottom > elementRect.top
            ) {
                newCollisions.push(element);
            }
        });

        if (this.haveCollisionsChanged(newCollisions)) {
            this.currentCollisions = newCollisions;

            EventBus.instance.emit('mouseHitboxCollision', {
                id: this.hitboxId,
                collisions: this.currentCollisions
            });
        }
    }

    /**
     * Checks if the collisions have changed
     */
    private haveCollisionsChanged(newCollisions: HTMLElement[]): boolean {
        if (newCollisions.length !== this.currentCollisions.length) {
            return true;
        }

        for (let i = 0; i < newCollisions.length; i++) {
            if (!this.currentCollisions.includes(newCollisions[i])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks if a session is currently active
     */
    public isSessionActive(): boolean {
        return this.sessionActive;
    }
}
