import { Constructor } from "../types";

export interface isSelectable {
    selectable: boolean;
}

export function Selectable(color: string = "green") {
    return function <Class extends Constructor>(target: Class, context: ClassDecoratorContext<Class>) {
        //@ts-ignore
        return class extends target implements isSelectable {
            protected _selectableColor: string = color;

            override get selectable(): boolean {
                return this.element.classList.contains("selectable");
            }

            override set selectable(value: boolean) {
                if (value) {
                    this.element.style.setProperty('--selectable-color', this._selectableColor);
                    this.element.classList.add("selectable");
                } else {
                    this.element.classList.remove("selectable");
                }
            }

        };
    }
}