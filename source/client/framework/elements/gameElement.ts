import { Logger } from "../core/logger";
import { createElement } from "../utils/dom";

export abstract class GameElement {
    abstract get PARENT_ID(): string;
    abstract get ELEMENT_ID(): string;

    get id(): number {
        return this._id
    };

    protected _id: number = 0;
    private _element?: HTMLDivElement;
    private _enabledForEvents: boolean = true;

    protected behaviorActions: Function[] = [];

    protected initializeBehaviors() {
        return;
    }

    private runBehaviorActions() {
        this.behaviorActions.forEach(action => action());
    }

    // Parent-child relationship properties
    private _parent?: GameElement;
    private _children: GameElement[] = [];

    /**
     * Determines if this element should be rendered when its parent is rendered
     * Override this in child classes to change the default behavior
     */
    get renderWithParent(): boolean {
        return true;
    }

    /**
     * Gets the parent GameElement if one exists
     */
    get parent(): GameElement | undefined {
        return this._parent;
    }

    /**
     * Gets all child GameElements
     */
    get children(): GameElement[] {
        return [...this._children]; // Return a copy to prevent direct modification
    }

    /**
     * Static factory method to create a GameElement with a parent
     * @param parent The parent GameElement
     * @param id The ID of the element
     * @returns A new GameElement instance
     */
    static createChild<T extends GameElement>(this: new (...args: any[]) => T, parent: GameElement, ...args: any[]): T {
        const element = new this(...args);
        parent.addChild(element);
        return element;
    }

    abstract get HTML_DEFINITION(): string;
    get insertPosition(): InsertPosition {
        return `beforeend`;
    }

    /**
     * Creates a new GameElement
     * @param id The ID of this element
     */
    constructor(id: number = 0) {
        this._id = id;
        this.afterConstructor();
        this.initializeBehaviors();
    }

    /**
     * Adds a child GameElement to this element
     * @param child The child element to add
     */
    public addChild(child: GameElement): void {
        if (!this._children.includes(child)) {
            this._children.push(child);
            // Set this as the parent if it's not already set
            if (child._parent !== this) {
                // If child already has a parent, remove it from that parent's children
                if (child._parent) {
                    child._parent.removeChild(child);
                }
                child._parent = this;
            }
        }
    }

    /**
     * Removes a child GameElement from this element
     * @param child The child element to remove
     */
    public removeChild(child: GameElement): void {
        const index = this._children.indexOf(child);
        if (index !== -1) {
            this._children.splice(index, 1);
            // Clear parent reference if it points to this
            if (child._parent === this) {
                child._parent = undefined;
            }
        }
    }

    /**
     * Finds a child element by its ID
     * @param elementId The ID of the child element to find
     * @returns The child element or undefined if not found
     */
    public findChildById(elementId: string): GameElement | undefined {
        return this._children.find(child => child.ELEMENT_ID === elementId);
    }

    public afterConstructor() { }

    get element() {
        if (this._element !== undefined)
            return this._element;
        const element = document.getElementById(this.ELEMENT_ID);
        if (element == null) throw Error(`Element ${this.consoleId} was not found on the board`);
        this._element = element as HTMLDivElement;
        return this._element
    }

    private get elementSafe() {
        try {
            return this.element;
        } catch (error) {
            return undefined;
        }
    }

    public beforeRender(force: boolean): void { };

    public render(force: boolean = false, args: { styles?: [{ [key: string]: string }] } = {}): this {
        if (this.elementSafe && !force) {
            Logger.debug(`Element ${this.consoleId} was already on the board`);
            return this;
        }
        if (force) {
            this.destroy();
        }

        this.beforeRender(force);
        const parentElement = document.getElementById(this.PARENT_ID);
        if (parentElement == null) throw new Error(`Parent Element for ${this.consoleId} not found`);
        const element = createElement(this.HTML_DEFINITION);
        if (args?.styles) {
            for (const style of args.styles) {
                for (const key in style) {
                    element.style.setProperty(key, style[key]);
                }
            }
        }
        parentElement.insertAdjacentElement(this.insertPosition, element);
        this.runBehaviorActions();

        this.afterRenderThis(force);
        this.addEventListeners();

        // Render children that should be rendered with parent
        this._children.forEach(child => {
            if (child.renderWithParent) {
                child.render(force);
            }
        });

        this.afterRenderAll(force);

        return this;
    }

    public afterRenderThis(_force: boolean): void { };

    public afterRenderAll(_force: boolean): void { };

    public show(): this {
        this.element.style.removeProperty("display");
        this.element.classList.remove("hidden");
        this.afterShow();
        return this;
    }
    public afterShow() { }

    public hide(): this {
        this.element.classList.add("hidden");
        this.afterHide();
        return this;
    }

    public afterHide() { }

    public deactivate(): this {
        this.element.style.display = "none";
        return this;
    }

    public enableEvents(): this {
        this._enabledForEvents = true;
        return this;
    }

    public disableEvents(): this {
        this._enabledForEvents = false;
        return this;
    }

    protected addEventListeners(): void { };
    protected removeEventListeners(): void {
        const clonedElement = this.element.cloneNode(true) as HTMLDivElement;
        this.element.parentNode.replaceChild(clonedElement, this.element);
        this._element = clonedElement;
    };

    public addEventToElement(element: Element, type: string, listener: Function) {
        const bindedListener = (event: Event) => {
            Logger.debug(`Event ${type} on ${element.id} Triggered`);
            //@ts-ignore
            if (!gameui.isReadOnly() && gameui.isCurrentPlayerActive() && this._enabledForEvents) {
                listener.call(this, event);
            } else {
                Logger.debug(`Event ${type} on ${element.id} Canceled due to: ${gameui.isCurrentPlayerActive() ? "Not active player" : "Events disabled"}`);
            }
        };
        element.addEventListener(type, bindedListener);
    }

    public beforeDestroy(): void { };

    public destroy() {
        // First destroy all children
        while (this._children.length > 0) {
            const child = this._children[0];
            child.destroy();
            // removeChild will be called by the child's destroy method
        }

        // Remove from parent if exists
        if (this._parent) {
            this._parent.removeChild(this);
            this._parent = undefined;
        }

        try {
            this.element.remove();
            Logger.debug(`Destroying ${this.consoleId}`);
        } catch (error) { } finally { this.afterDestroy(); this._element = undefined; }
    }

    public afterDestroy() { };

    public get consoleId() {
        return `${this.constructor.name}:${this.id}`
    }
}

export abstract class DynamicGameElement extends GameElement {

    override get PARENT_ID(): string {
        return this._parent_id;
    }

    override get ELEMENT_ID(): string {
        return this._element_id;
    }

    private _parent_id: string;
    private _element_id: string;

    constructor(id: number = 0, parent_id: string, element_id: string) {
        super(id);
        this._parent_id = parent_id;
        this._element_id = element_id;
        this.afterConstructor();
    }

    // No need to override the create method as the base class version is flexible enough
}