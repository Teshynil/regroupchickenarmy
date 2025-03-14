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