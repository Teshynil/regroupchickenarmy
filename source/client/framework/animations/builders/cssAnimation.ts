import { Logger } from '../../core/logger';
import { Animation, ElementOrId } from '../animation';
import { CommonAnimationBuilder } from './commonAnimationBuilder';

export class CssAnimationBuilder extends CommonAnimationBuilder {
    protected _element: ElementOrId;

    protected _animationClass: string[];

    protected constructor() {
        super();
    }

    static override builder() {
        return new CssAnimationBuilder();
    }

    element(element: ElementOrId): this {
        this._element = element;
        return this;
    }

    animationClass(...animationClass: string[]): this {
        this._animationClass = animationClass;
        return this;
    }

    override _build(): Animation {
        const dojoAnimation = new dojo.Animation({
            node: this._element,
            duration: this._duration,
            delay: this._delay,
            curve: [0, 1],
        });
        this._beforeStartCallbacks.push((element, animation) => {
            const duration = gameui.bgaAnimationsActive() ? animation.duration : 0;
            if (duration == 0) {
                Logger.debug(`Skipping cssAnimation ${animation.id} due to animations being disabled`);
            }
            element.style.setProperty('--animation-duration', `${duration}ms`);
            element.classList.add(...this._animationClass);
        });
        const animation = new Animation(this._id, this._element, dojoAnimation, this._waitFor, this._waitForDuration);
        animation.debugData = {
            element: this._element,
            animationClass: this._animationClass,
        };
        return animation;
    }
}
