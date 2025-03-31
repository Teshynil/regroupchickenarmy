import { remove } from "dojo/dom-class";
import { GameElement } from "../utils/gameElement";
import { Slot } from "../definitions";
import { ListenerConfig, ListenerElement } from "../utils/listenerElement";
import { Cards, Card } from "./cards";
import { RegroupChickenArmy } from "../regroupchickenarmy";
import { delay } from "../utils/gameUtils";
import { EventBus } from "../utils/eventBus";

export class Grid extends ListenerElement {

    PARENT_ID = `playerArea_${this.id}`;
    ELEMENT_ID = `mapContainer_${this.id}`;

    get listeners(): ListenerConfig {
        return {
            "addCardToGrid": { callback: this.doAddCardToGrid },
            "addInitialCards": { callback: this.doAddInitialCard },

            "cardplaced": { callback: this.doCardPlaced, isCustomEvent: true },
            "mouseHitboxCollision": { callback: this.doMouseHitboxCollision, isCustomEvent: true }
        }
    };

    htmlDefinition = `<div id="mapContainer_${this.id}" class="mapContainer"></div>`;

    scrollmap: ScrollmapWithZoomNS.ScrollmapWithZoom;
    gridDiv: HTMLDivElement;
    grid: number[][] = [
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xE, 0xE, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xE, 0xE, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
        [0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF, 0xF],
    ];
    cardsPlayed: number = 0;

    public override afterRender(force: boolean): void {
        //@ts-ignore    
        this.scrollmap = new ebg.scrollmapWithZoom();
        this.scrollmap.minZoom = 0.5;
        this.scrollmap.maxZoom = 1;
        this.scrollmap.bEnableZooming = false;
        //@ts-ignore
        window.grids[this.id] = this;
        this.scrollmap.startPosition = { x: 0, y: 0 };
        this.scrollmap.createCompletely($(this.element));
        this.scrollmap.zoomingOptions.bWheelZooming = false;
        this.scrollmap.bEnableScrolling = false;
        document.querySelectorAll(".scrollmap_button_wrapper, .scrollmap_icon_always_visible").forEach(e => e.remove());

        this.scrollmap.scrollable_div.insertAdjacentHTML('beforeend', `
			<div id="grid_${this.id}" class="grid">
			</div>
		  `);
        const grid = document.getElementById(`grid_${this.id}`) as HTMLDivElement;
        this.gridDiv = grid;
        if (this.grid.length !== this.grid[0].length) {
            throw new Error(`Player Area ${this.id} not found`);
        }
        const size = this.grid.length;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                grid.insertAdjacentHTML(`beforeend`, `<div id="player_${this.id}_cell_${y}_${x}" class="cell" data-y="${y}" data-x="${x}"></div>`);
            }

        }
        this.scrollmap.container_subdiv.style.opacity = "0";
        this.scrollmap.surface_div.style.cursor = "default";
        this.scrollmap.container_subdiv.style.transition = "opacity 0.5s ease-in-out";
        this.activateCellsAroundPosition(6,6);
        setTimeout(() => {
            this.scrollmap.container_subdiv.style.opacity = "1";
            this.resizeGrid();
        }, 500);
    }

    resizeGrid() {
        const activeCells = this.gridDiv.querySelectorAll<HTMLDivElement>('.cell.active');

        if (activeCells.length === 0) {
            this.gridDiv.style.gridTemplateColumns = '0';
            this.gridDiv.style.gridTemplateRows = '0';
            return;
        }

        // Track min/max positions of active cells
        let minCol = Infinity, maxCol = -Infinity;
        let minRow = Infinity, maxRow = -Infinity;

        activeCells.forEach(cell => {
            const col = parseInt(cell.dataset["x"]);
            const row = parseInt(cell.dataset["y"]);

            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
        });

        // Calculate needed grid size
        const cols = maxCol - minCol + 3;
        const rows = maxRow - minRow + 3;

        minCol--; minRow--;
        maxCol++; maxRow++;

        // Apply new grid dimensions
        this.gridDiv.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
        this.gridDiv.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

        // Reposition active cells
        activeCells.forEach(cell => {
            const newCol = parseInt(cell.dataset["x"]) - minCol + 1;
            const newRow = parseInt(cell.dataset["y"]) - minRow + 1;
            cell.style.gridColumn = newCol.toString();
            cell.style.gridRow = newRow.toString();
        });

        const playedCards = this.gridDiv.querySelectorAll<HTMLDivElement>('.card');

        playedCards.forEach(cell => {
            const newCol = parseInt(cell.dataset["x"]) - minCol + 1;
            const newRow = parseInt(cell.dataset["y"]) - minRow + 1;
            cell.style.gridColumn = newCol.toString();
            cell.style.gridRow = newRow.toString();
        });

        this.scrollmap.zoomToFitAndScrollToCenter();

        window.addEventListener("resize", (event) => {
            this.scrollmap.zoomToFitAndScrollToCenter();
        });
    }

    addCardToGrid(cardId: number, posX: number, posY: number, rotation: number) {
        posX = Number(posX);
        posY = Number(posY);
        const card = Cards[cardId as keyof typeof Cards] as { getSlots(rotation: number): Slot[] };

        if (card == undefined) {
            throw Error(`Card_${cardId} does not exists`);
        }

        if (!this.isValidPlacement(posX, posY)) {
            throw Error(`Invalid placement for card_${cardId}`);
        }

        const slots = card.getSlots(rotation);
        this.grid[posY][posX] = slots[0];
        this.grid[posY][posX + 1] = slots[1];
        this.grid[posY + 1][posX] = slots[2];
        this.grid[posY + 1][posX + 1] = slots[3];

        this.activateCellsAroundPosition(posX, posY);
    }

    /**
     * Activates cells in a 4x4 area around the specified position
     * @param posX The x coordinate of the top-left corner
     * @param posY The y coordinate of the top-left corner
     */
    private activateCellsAroundPosition(posX: number, posY: number): void {
        for (let y = -1; y <= 2; y++) {
            for (let x = -1; x <= 2; x++) {
                const _x = posX + x;
                const _y = posY + y;

                if (_x < 0 || _y < 0 || _x >= this.grid[0].length || _y >= this.grid.length) {
                    continue;
                }

                const cell = document.getElementById(`player_${this.id}_cell_${_y}_${_x}`) as HTMLDivElement;
                if (cell) {
                    cell.classList.add("active");
                }
            }
        }
    }

    async doAddCardToGrid(notif: BGA.Notif<"addCardToGrid">) {

    }

    async doAddInitialCard(notif: BGA.Notif<"addInitialCards">) {
        if (notif.args.playersCards[this.id] == undefined) return;
        const card_id = notif.args.playersCards[this.id].card_id;
        this.addCardToGrid(card_id, 6, 6, 0);
        const card: Card = new Card(card_id, `leaderImg_${this.id}`, `InitialCard_${this.id}`, Cards[card_id as keyof Cards]);
        card.render();
        const element = card.element;
        const animation = RegroupChickenArmy.game.slideToObject(element, `player_${this.id}_cell_${6}_${6}`, 1000, 600);
        await animation.playAsync();
        element.remove();
        this.createCardOnGrid(card_id, 6, 6);
    }

    async doCardPlaced(event: Game.BoardEventTypes["cardplaced"]) {
        if (this.id === event.grid_id) {
            const data = event;
            const card: Card = new Card(data.cardId, this.gridDiv.id, `placedCard`, Cards[data.cardId as keyof Cards]);
            card.render();
            card.element.classList.add("highlight");
            card.rotation = data.rotation;
            card.element.dataset["x"] = `${data.x}`;
            card.element.dataset["y"] = `${data.y}`;
            card.element.style.zIndex = `${this.cardsPlayed + 1}`;
            this.resizeGrid();
        }
    }

    createCardOnGrid(cardId: number, posX: number, posY: number) {
        this.cardsPlayed++;
        const zIndex = this.cardsPlayed;
        this.gridDiv.insertAdjacentHTML(this.insertPosition, `<div class="card" data-card-id="${cardId}" data-y="${posY}" data-x="${posX}" style="z-index:${zIndex};"></div>`);
        this.resizeGrid();
    }

    isValidPlacement(posX: number, posY: number): boolean {
        if (posX < 0 || posY < 0 || posX > 12 || posY > 12) {
            return false;
        }

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                if (this.grid[posY + row][posX + col] != Slot.NN) {
                    return true;
                }
            }
        }
        return false;
    }

    async doMouseHitboxCollision(event: Game.BoardEventTypes["mouseHitboxCollision"]) {
        if (event.id != this.id) return;
        if (event.collisions.length == 4) {
            const cardId = RegroupChickenArmy.game.marketArea.cardRotationWindow.card.cardId;
            const x = Number(event.collisions[0].dataset["x"]);
            const y = Number(event.collisions[0].dataset["y"]);
            this.createTemporalCardOnGrid(cardId, x, y);
        } else if (event.collisions.length > 0) {
            // Check if the collisioned cell are all empty slots if so remove the temporal card
            const grid = this.grid;
            const collisions = event.collisions;
            const isAllEmptySlots = collisions.every(cell => grid[Number(cell.dataset["y"])][Number(cell.dataset["x"])] == Slot.NN);
            if (isAllEmptySlots) {
                document.getElementById("temporalCard")?.remove();
            }
        }else{
            document.getElementById("temporalCard")?.remove();
        }
    }

    createTemporalCardOnGrid(cardId: number, posX: number, posY: number) {
        document.getElementById("temporalCard")?.remove();
        const rotation = RegroupChickenArmy.game.marketArea.cardRotationWindow.card.rotation;
        this.gridDiv.insertAdjacentHTML(
            this.insertPosition,
            `<div class="card" id="temporalCard" data-card-id="${cardId}" data-y="${posY}" data-x="${posX}" style="--rotation:${rotation}"></div>`);
        this.resizeGrid();
        const temporalCard = document.getElementById("temporalCard") as HTMLDivElement;
        this.addEventToElement(temporalCard, "click", this.selectLocationForCardPlacement);
    }

    selectLocationForCardPlacement() {
        let temporalCard = document.getElementById("temporalCard") as HTMLDivElement;

        const x = Number(temporalCard.dataset["x"]);
        const y = Number(temporalCard.dataset["y"]);
        const cardId = Number(temporalCard.dataset["cardId"]);
        const rotation = Number(temporalCard.style.getPropertyValue("--rotation"));
        temporalCard.remove();
        EventBus.instance.emit("cardplaced",
            { grid_id: this.id, x, y, cardId, rotation: rotation }
        );
    }
}
