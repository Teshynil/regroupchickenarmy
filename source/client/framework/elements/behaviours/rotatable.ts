import { Constructor } from "../types";

export interface isRotatable {
    rotation: number;
    step: number;
    rotate(rotation: number): void;
}


export function Rotatable(step: number = 90) {
    return function <Class extends Constructor>(target: Class, context: ClassDecoratorContext<Class>) {
        //@ts-ignore
        return class extends target implements isRotatable {
            private _rotation: number = 0;

            override get rotation(): number {
                return this._rotation;
            }

            override get step(): number {
                return step;
            }

            override initializeBehaviors() {
                super.initializeBehaviors();
                this.behaviorActions.push(() => {
                    this.element.classList.add("rotatable");
                    this.element.style.setProperty('--rotation', `${this.rotation}`);
                    this.element.style.setProperty('--step', `${this.step}deg`);
                });
            }

            override set rotation(value: number) {
                this._rotation = value;
                this.element.style.setProperty('--rotation', `${value}`);
            }

            override rotate(rotation: number): void {
                this.rotation = this.rotation + rotation;
            }
        };
    }
}