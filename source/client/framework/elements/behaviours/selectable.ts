import { createElement } from '../../utils/dom';
import { Constructor } from '../types';

export interface isSelectable {
    selectable: boolean;
}

export function Selectable(color: string = 'green') {
    return function <Class extends Constructor>(target: Class, context: ClassDecoratorContext<Class>) {
        //@ts-ignore
        return class extends target implements isSelectable {
            protected _selectableColor: string = color;

            protected _selectableHTMLDefinition: string = `<div class="selectable"></div>`;

            override get selectable(): boolean {
                return this.element.classList.contains('selectable');
            }

            override set selectable(value: boolean) {
                if (value) {
                    this.element.style.setProperty('--selectable-color', this._selectableColor);
                    const selectableElement = createElement(this._selectableHTMLDefinition);
                    this.element.appendChild(selectableElement);
                } else {
                    this.element.querySelector('.selectable')?.remove();
                }
            }
        };
    };
}

export function makeHtmlElementSelectable(element: HTMLDivElement, color: string = 'green') {
    if (element.querySelector('.selectable') !== null) return element;
    const selectableElement = createElement(`<div class="selectable"></div>`);
    element.style.setProperty('--selectable-color', color);
    element.appendChild(selectableElement);
    return element;
}

export function removeHtmlElementSelectable(element: HTMLDivElement, color: string = 'green') {
    element.querySelectorAll('.selectable')?.forEach((e) => e.remove());
    element.style.setProperty('--selectable-color', color);
    return element;
}
