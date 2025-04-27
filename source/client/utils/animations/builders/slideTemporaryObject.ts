import { Animation, ElementOrId } from "../animation";
import { SlideToObjectBuilder } from "./slideToObjectBuilder";

export class SlideTemporaryObjectBuilder extends SlideToObjectBuilder {
    protected _definition: string;
    protected _parent: string;
    protected _from: ElementOrId;

    protected constructor() {
        super();
    }

    static override builder() {
        return new SlideTemporaryObjectBuilder();
    }

    definition(definition: string): this {
        this._definition = definition;
        return this;
    }

    parent(parent: string): this {
        this._parent = parent;
        return this;
    }

    from(from: ElementOrId): this {
        this._from = from;
        return this;
    }
    override _build(): Animation {
        this._element = dojo.place(this._definition, this._parent);
        dojo.style(this._element, {
            position: 'absolute',
            opacity: '0',
            left: '0px',
            top: '0px'
        });
        gameui.placeOnObject(this._element, this._from);
        const dojoAnimation = gameui.slideToObject(this._element, this._target, this._duration, this._delay);
        const animation = new Animation(this._id, this._element, dojoAnimation, this._waitFor, this._waitForDuration);
        // This ensures the element is visible when the animation starts before any callbacks are executed
        animation.beforeStartCallbacks.push(() => {
            dojo.style(this._element, 'opacity', '1');
        });
        // This ensures the element is destroyed when the animation ends and all callbacks are executed
        this._afterEndCallbacks.push((element) => {
            dojo.destroy(element);
        });
        animation.debugData = {
            definition: this._definition,
            parent: this._parent,
            from: this._from,
            target: this._target
        }
        return animation;
    }
}