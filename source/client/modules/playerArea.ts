import { Grid } from "./grid";
import { PlayerPanel } from "./playerPanel";
export class PlayerArea {
    id: number;
    active: boolean = false;
    grid: Grid;
    panel: PlayerPanel;

    constructor(id: number) {
        this.id = id;
    }

    render() {
        const board = document.getElementById('board');
        if (board == null) throw new Error("Board not found");
        board.insertAdjacentHTML('beforeend', `
            <div id="playerBackground_${this.id}" class="playerBackground ${!this.active ? "inactive" : ""}"></div>
			<div id="playerArea_${this.id}" class="playerArea ${!this.active ? "inactive" : ""}">
                <div id="mapContainer_${this.id}" class="mapContainer">
                </div>
			</div>
		  `);
        this.grid = new Grid(this.id);
        this.grid.generateGrid();

        this.panel = new PlayerPanel(this.id, this.active);
        this.panel.render();
    }

    enable() {
        this.panel.enable();
        document.getElementById(`playerBackground_${this.id}`).classList.remove("inactive");
        document.getElementById(`playerArea_${this.id}`).classList.remove("inactive");
    }

    disable() {
        document.getElementById(`playerBackground_${this.id}`).classList.add("inactive");
        document.getElementById(`playerArea_${this.id}`).classList.add("inactive");
        this.panel.disable();
    }
}