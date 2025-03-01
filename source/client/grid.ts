import { remove } from "dojo/dom-class";

export class Grid {
    id: number;
    scrollmap: ScrollmapWithZoomNS.ScrollmapWithZoom;
    gridDiv: HTMLDivElement;
    base_grid: number[][] = [
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

    constructor(id: number) {
        this.id = id;
    }


    generateGrid() {
        const mapContainer = document.getElementById(`mapContainer_${this.id}`);
        if (mapContainer == null) throw new Error(`Map Container ${this.id} not found`);

        //@ts-ignore    
        this.scrollmap = new ebg.scrollmapWithZoom();
        this.scrollmap.minZoom = 0.5;
        this.scrollmap.maxZoom = 1;
        this.scrollmap.bEnableZooming = false;
        //@ts-ignore
        window.grids[this.id] = this;
        this.scrollmap.startPosition = { x: 0, y: 0 };
        this.scrollmap.createCompletely($(mapContainer));
        this.scrollmap.zoomingOptions.bWheelZooming = false;
        document.querySelectorAll(".scrollmap_button_wrapper:not(.reset), .scrollmap_icon_always_visible").forEach(e => e.remove());

        this.scrollmap.scrollable_div.insertAdjacentHTML('beforeend', `
			<div id="grid_${this.id}" class="grid">
			</div>
		  `);
        const grid = document.getElementById(`grid_${this.id}`) as HTMLDivElement;
        this.gridDiv = grid;
        if (this.base_grid.length !== this.base_grid[0].length) {
            throw new Error(`Player Area ${this.id} not found`);
        }
        const size = this.base_grid.length;
        for (let y = 1; y <= size; y++) {
            for (let x = 1; x <= size; x++) {
                const isActive = this.base_grid[y - 1][x - 1] != 0xF ? "active" : "";
                grid.insertAdjacentHTML(`beforeend`, `<div id="player_${this.id}_cell_${y}_${x}" class="cell ${isActive}" data-y="${y}" data-x="${x}"></div>`);
            }

        }
        this.scrollmap.container_subdiv.style.opacity = "0";
        this.scrollmap.container_subdiv.style.transition = "opacity 0.5s ease-in-out";
        setTimeout(() => {
            this.scrollmap.container_subdiv.style.opacity = "1";
            this.resizeGrid();
        }, 1000);
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

        this.scrollmap.zoomToFitAndScrollToCenter();

        window.addEventListener("resize", (event) => {
            this.scrollmap.zoomToFitAndScrollToCenter();
        });
    }
}
