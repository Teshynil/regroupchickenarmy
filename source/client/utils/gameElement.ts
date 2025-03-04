export abstract class GameElement {
    abstract get PARENT_ID(): string;
    abstract get ELEMENT_ID(): string;
    get id(): number {
        return this._id
    };
    protected _id: number = 0;
    private _element?: HTMLDivElement;

    abstract get htmlDefinition(): string;
    abstract get insertPosition(): InsertPosition;

    get element() {
        if (this._element !== undefined)
            return this._element;
        const element = document.getElementById(this.ELEMENT_ID);
        if (element == null) throw Error(`Element ${this.consoleId} was not found on the board`);
        this._element = element as HTMLDivElement;
        return this._element
    }

    public beforeRender(): void { };

    public render(force: boolean = false) {
        this.beforeRender();

        if (this._element && !force) {
            console.info(`Element ${this.consoleId} was already on the board`);
            return this;
        }
        if (force) {
            this.destroy();
        }
        const parentElement = document.getElementById(this.PARENT_ID);
        if (parentElement == null) throw new Error(`Parent Element for ${this.consoleId} not found`);
        parentElement.insertAdjacentHTML(this.insertPosition, this.htmlDefinition);

        this.afterRender();
        return this;
    }

    public afterRender(): void { };

    public show() {
        this.element.style.removeProperty("display");
        this.element.classList.remove("hidden");
        return this;
    }

    public hide() {
        this.element.classList.add("hidden");
        return this;
    }

    public deactivate() {
        this.element.style.display = "none";
        return this;
    }

    public destroy() {
        this.element.remove();
    }

    private get consoleId() {
        return `${this.constructor.name}:${this.id}`
    }
}