import { GameElement } from "./gameElement";
import { isRotatable } from "./behaviours/rotatable";
import { isSelectable } from "./behaviours/selectable";

declare module "./gameElement" {
    interface GameElement extends
        isRotatable,
        isSelectable { }
}

export type Constructor = new (...args: any[]) => GameElement;