import { Animation } from "../animation";
import { SlideToObjectBuilder } from "./slideToObjectBuilder";

export class SlideToObjectPosBuilder extends SlideToObjectBuilder {
    protected _targetX: number;
    protected _targetY: number;

    protected constructor() {
        super();
    }

    static override builder() {
        return new SlideToObjectPosBuilder();
    }


    targetPos(target_x: number, target_y: number): this {
        this._targetX = target_x;
        this._targetY = target_y;
        return this;
    }

    override _build(): Animation {
        const dojoAnimation = gameui.slideToObjectPos(this._element, this._target, this._targetX, this._targetY, this._duration, this._delay);
        const animation = new Animation(this._id, this._element, dojoAnimation, this._waitFor, this._waitForDuration);
        animation.debugData = {
            element: this._element,
            target: this._target,
            targetX: this._targetX,
            targetY: this._targetY
        }
        return animation;
    }
}
