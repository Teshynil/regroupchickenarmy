import { RegroupChickenArmy } from "../regroupchickenarmy";
import { GameElement } from "../utils/gameElement";
import { ListenerElement } from "../utils/listenerElement";
import { Grid } from "./grid";
import { PlayerPanel } from "./playerPanel";
export class PlayerArea extends ListenerElement {

    get listeners() {
        return {
        }
    };

    PARENT_ID = "board";
    ELEMENT_ID = `playerArea_${this.id}`;

    HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}" class="playerArea"></div>`;

    grid: Grid;
    panel: PlayerPanel;

    eliminatePlayer() {
        const player_id = RegroupChickenArmy.game.getPlayerIdFromLeaderId(this.id);
        this.element.classList.add("player-eliminated");
        this.panel.element.classList.add("player-eliminated");
        this.panel.leaderPanel.healthElement.innerText = "X";
        document.getElementById(`player_score_${player_id}`).classList.add("eliminated");
    }

    override afterConstructor() {
        this.grid = Grid.createChild(this, this.id);
        this.panel = PlayerPanel.createChild(this, this.id);
    }

    override afterShow() {
        this.panel.show();
        RegroupChickenArmy.game.board.backgrounds[this.id].isActive = true;
    }

    override afterHide() {
        this.panel.hide();
        RegroupChickenArmy.game.board.backgrounds[this.id].isActive = false;
    }

    override beforeDestroy(): void {
        this.grid.destroy();
        this.panel.destroy();
    }
}
