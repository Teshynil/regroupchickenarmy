import { Animation, ElementOrId } from "../animation";
import { CommonAnimationBuilder } from "./commonAnimationBuilder";

export class SlideToObjectBuilder extends CommonAnimationBuilder {
    protected _element: ElementOrId;
    protected _target: ElementOrId;

    protected constructor() {
        super();
    }

    static override builder() {
        return new SlideToObjectBuilder();
    }

    element(mobile_obj: ElementOrId): this {
        this._element = mobile_obj;
        return this;
    }

    target(target_obj: ElementOrId): this {
        this._target = target_obj;
        return this;
    }

    override _build(): Animation {
        const dojoAnimation = gameui.slideToObject(this._element, this._target, this._duration, this._delay);
        const animation = new Animation(this._id, this._element, dojoAnimation, this._waitFor, this._waitForDuration);
        animation.debugData = {
            element: this._element,
            target: this._target
        }
        return animation;
    }
}
