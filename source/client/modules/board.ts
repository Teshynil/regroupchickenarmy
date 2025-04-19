import { Animator } from "../utils/animations/animator";
import { GameElement } from "../utils/gameElement";
import { CentralArea } from "./centralArea";
import { PlayerArea } from "./playerArea";

export class Board extends GameElement {
    PARENT_ID = `game_play_area`;
    ELEMENT_ID = `board`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}"></div>`;

    backgrounds: PlayerBackground[] = [];
    centralArea: CentralArea;
    playerAreas: PlayerArea[] = [];

    constructor() {
        super();

        // Initialize child components with this as parent
        this.backgrounds = [
            PlayerBackground.createChild(this, 0),
            PlayerBackground.createChild(this, 1),
            PlayerBackground.createChild(this, 2),
            PlayerBackground.createChild(this, 3)
        ];

        this.centralArea = CentralArea.createChild(this);

        this.playerAreas = [
            PlayerArea.createChild(this, 0),
            PlayerArea.createChild(this, 1),
            PlayerArea.createChild(this, 2),
            PlayerArea.createChild(this, 3)
        ];
    }

    public override afterRenderThis(_force: boolean): void {
        // Children are automatically rendered by the parent class

        // Hide player areas initially
        this.playerAreas.forEach(playerArea => {
            playerArea.hide();
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

    HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}" class="playerBackground"></div>`;


    public override afterRenderThis(_force: boolean): void {
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