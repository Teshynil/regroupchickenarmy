import { Animator } from "../utils/animations/animator";
import { GameElement } from "../utils/gameElement";

export class Board extends GameElement {
    PARENT_ID = `game_play_area`;
    ELEMENT_ID = `board`;
    htmlDefinition = `<div id="${this.ELEMENT_ID}"><div id="centralArea"></div></div>`;

    backgrounds: PlayerBackground[] = [new PlayerBackground(0), new PlayerBackground(1), new PlayerBackground(2), new PlayerBackground(3)];

    public override afterRender(force: boolean): void {
        this.backgrounds.forEach(background => {
            background?.render();
        });
    }

    set isActive(val: boolean) {
        if (val) {
            this.element.classList.add("activePlayer");
        } else {
            this.element.classList.remove("activePlayer");
        }
    }

    get isActive(): boolean {
        return this.element.classList.contains("activePlayer");
    }

    public async waitAnimations(): Promise<void> {
        const timeout = 3000;
        const startTime = Date.now();

        return new Promise((resolve) => {
            const checkAnimation = () => {
                if (Animator.instance.isQueueEmpty || Date.now() - startTime >= timeout) {
                    resolve();
                } else {
                    setTimeout(checkAnimation, 500); // Check every 100ms
                }
            };

            checkAnimation();
        });
    }
}


class PlayerBackground extends GameElement {
    PARENT_ID = "board";
    ELEMENT_ID = `playerBackground_${this.id}`;

    htmlDefinition: string = `<div id="${this.ELEMENT_ID}" class="playerBackground"></div>`;


    public override afterRender(force: boolean): void {
        this.isActive = false;
    }
    set isActive(val: boolean) {
        if (!val) {
            this.element.classList.add("inactive");
        } else {
            this.element.classList.remove("inactive");
        }
    }
}