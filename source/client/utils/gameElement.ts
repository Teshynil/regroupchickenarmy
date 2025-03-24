import { RegroupChickenArmy } from "../regroupchickenarmy";

export abstract class GameElement {
    abstract get PARENT_ID(): string;
    abstract get ELEMENT_ID(): string;

    get id(): number {
        return this._id
    };

    protected _id: number = 0;
    private _element?: HTMLDivElement;
    private _enabledForEvents: boolean = true;

    abstract get htmlDefinition(): string;
    get insertPosition(): InsertPosition {
        return `beforeend`;
    }

    constructor(id: number = 0) {
        this._id = id;
        this.afterConstructor();
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

    public render(force?: boolean) {
        if (force === undefined) force = false;
        this.beforeRender(force);

        if (this.elementSafe && !force) {
            console.info(`Element ${this.consoleId} was already on the board`);
            return this;
        }
        if (force) {
            this.destroy();
        }
        const parentElement = document.getElementById(this.PARENT_ID);
        if (parentElement == null) throw new Error(`Parent Element for ${this.consoleId} not found`);
        parentElement.insertAdjacentHTML(this.insertPosition, this.htmlDefinition);

        this.afterRender(force);
        this.addEventListeners();
        return this;
    }

    public afterRender(force: boolean): void { };

    public show() {
        this.element.style.removeProperty("display");
        this.element.classList.remove("hidden");
        this.afterShow();
    }
    public afterShow() { }

    public hide() {
        this.element.classList.add("hidden");
        this.afterHide();
    }

    public afterHide() { }

    public deactivate() {
        this.element.style.display = "none";
    }

    public enableEvents() {
        this._enabledForEvents = true;
    }

    public disableEvents() {
        this._enabledForEvents = false;
    }

    protected addEventListeners(): void { };
    protected removeEventListeners(): void { };

    public addEventToElement(element: Element, type: string, listener: Function) {
        const bindedListener = () => {
            if (RegroupChickenArmy.game.isCurrentPlayerActive() && this._enabledForEvents) {
                listener.apply(this);
            }
        };
        element.addEventListener(type, bindedListener.bind(this));
    }

    public beforeDestroy(): void { };

    public destroy() {
        try {
            this.element.remove();
        } catch (error) { };
    }

    private get consoleId() {
        return `${this.constructor.name}:${this.id}`
    }
}