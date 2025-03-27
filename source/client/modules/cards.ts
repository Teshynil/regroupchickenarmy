import { Slot } from "../definitions";
import { RegroupChickenArmy } from "../regroupchickenarmy";
import { DynamicGameElement } from "../utils/gameElement";
import { EventBus } from "../utils/eventBus";

export class Card extends DynamicGameElement {

    override get htmlDefinition(): string {
        return `<div id="${this.ELEMENT_ID}" class="card" data-card-id="${this.cardId}"></div>`
    };

    get cardId(): number {
        return this._card.id;
    }

    private _card: _Card;

    get rotation(): number {
        return Number(this.element.style.getPropertyValue("--rotation"));
    }
    set rotation(value: number) {
        this.element.style.setProperty("--rotation", `${value}`);
    }

    rotate(rotation: number) {
        this.rotation = this.rotation + rotation;
    }

    constructor(id: number = 0, parent_id: string, element_id: string, card: _Card) {
        super(id, parent_id, element_id);
        this._card = card;
        this.afterConstructor();
    }

    public getSlots(): Slot[] {
        return this._card.getSlots(this.rotation);
    }

    private isDragging = false;
    private offsetX = 0;
    private offsetY = 0;
    private currentCells: Element[] = [];
    private gridCells: Element[] = [];
    private domEvents: { event: string, listener: Function }[] = [];


    set isDraggable(value: boolean) {
        if (value) {
            this.element.classList.add("draggable");
            this.addEventToElement(this.element, 'mousedown', this.onDragStart);
            const leader_id = RegroupChickenArmy.game.getLeaderIdFromPlayerId();
            this.gridCells = Array.from(document.querySelectorAll(`#grid_${leader_id} > .cell.active`));
        } else {
            this.element.classList.remove("draggable");
        }
    }

    private onDragStart = (e: MouseEvent) => {
        this.isDragging = true;
        const cardElement = this.element;
        cardElement.classList.add("dragging");
        cardElement.style.transition = 'scale var(--animation_quick)';

        const rect = cardElement.getBoundingClientRect();

        this.offsetX = rect.x + (rect.width / 2.0);
        this.offsetY = rect.y + (rect.height / 2.0);

        this.onMouseMove(e);

        const leader_id = RegroupChickenArmy.game.getLeaderIdFromPlayerId();
        cardElement.style.scale = `${RegroupChickenArmy.game.playerAreas.at(leader_id).grid.scrollmap.zoom * 0.99}`;

        const onMouseMove = this.onMouseMove.bind(this);
        const onMouseUp = this.onMouseUp.bind(this);
        this.domEvents.push({ event: 'mousemove', listener: onMouseMove });
        this.domEvents.push({ event: 'mouseup', listener: onMouseUp });

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    private onMouseMove = (e: MouseEvent) => {
        if (!this.isDragging) return;

        const x = e.clientX - this.offsetX;
        const y = e.clientY - this.offsetY;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        this.detectOverlappingCells();
    }

    private onMouseUp = (_e: MouseEvent) => {
        this.isDragging = false;
        this.element.classList.remove("dragging");

        this.domEvents.forEach(event => {
            document.removeEventListener(event.event, event.listener as EventListener);
        });

        // If there are highlighted cells, calculate the best position for the card
        if (this.currentCells.length > 0) {
            const bestPosition = this.calculateBestCardPosition();

            if (bestPosition) {
                // Dispatch an event with the cell position and card info
                EventBus.instance.emit('cardplaced', {
                    grid_id: RegroupChickenArmy.game.getLeaderIdFromPlayerId(),
                    x: bestPosition.x,
                    y: bestPosition.y,
                    cardId: this.cardId,
                    rotation: this.rotation
                });
            } else {
                // Reset position if no valid placement found
                this.element.style.left = `0px`;
                this.element.style.top = `0px`;
            }
        } else {
            // Reset position if not dropped on a valid cell
            this.element.style.left = `0px`;
            this.element.style.top = `0px`;
        }

        this.clearHighlights();
    }

    detectOverlappingCells() {
        const cardRect = this.element.getBoundingClientRect();
        this.currentCells = [];

        this.gridCells.forEach(cell => {
            const cellRect = cell.getBoundingClientRect();
            const isOverlapping = !(
                cardRect.right < cellRect.left ||
                cardRect.left > cellRect.right ||
                cardRect.bottom < cellRect.top ||
                cardRect.top > cellRect.bottom
            );

            if (isOverlapping) {
                this.currentCells.push(cell);
                (cell as HTMLElement).classList.add('highlight');
            } else {
                (cell as HTMLElement).classList.remove('highlight');
            }
        });
    }

    clearHighlights() {
        this.gridCells.forEach(cell =>
            (cell as HTMLElement).classList.remove('highlight')
        );
        this.currentCells = [];
    }

    /**
     * Calculates the best position for placing a 2x2 card based on overlapping active cells
     * @returns The top-left coordinates for the card placement or null if invalid
     */
    private calculateBestCardPosition(): { x: number, y: number } | null {
        if (this.currentCells.length === 0) return null;

        // Extract coordinates from highlighted cells
        const highlightedCoordinates: { x: number, y: number }[] = [];
        this.currentCells.forEach(cell => {
            const htmlCell = cell as HTMLElement;
            const x = parseInt(htmlCell.dataset['x'] || '0');
            const y = parseInt(htmlCell.dataset['y'] || '0');
            highlightedCoordinates.push({ x, y });
        });

        // Get the grid from the game
        const leaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId();
        const grid = RegroupChickenArmy.game.playerAreas.at(leaderId).grid.grid;

        // Generate all possible top-left positions for a 2x2 card that would include at least one highlighted cell
        const possiblePositions: { x: number, y: number, overlapCount: number }[] = [];

        // For each highlighted cell, check the 4 possible positions where it could be part of a 2x2 card
        highlightedCoordinates.forEach(({ x, y }) => {
            // The 4 possible positions where this cell could be part of a 2x2 card
            const potentialPositions = [
                { x: x - 1, y: y - 1 }, // top-left
                { x: x, y: y - 1 },   // top-right
                { x: x - 1, y: y },   // bottom-left
                { x: x, y: y }      // bottom-right (this cell is the top-left of the card)
            ];

            potentialPositions.forEach(pos => {
                // Skip if out of bounds
                if (pos.x < 0 || pos.y < 0 || pos.x + 1 >= grid[0].length || pos.y + 1 >= grid.length) {
                    return;
                }

                let overlapCount = 0;
                let isValid = true;

                // Check each of the 4 cells of the card (2x2)
                for (let dy = 0; dy < 2 && isValid; dy++) {
                    for (let dx = 0; dx < 2 && isValid; dx++) {
                        const checkX = pos.x + dx;
                        const checkY = pos.y + dy;

                        // Check if this position is one of our highlighted cells
                        const isHighlighted = highlightedCoordinates.some(c => c.x === checkX && c.y === checkY);

                        if (isHighlighted) {
                            overlapCount++;
                        }
                        // If not highlighted, it must be empty (not an active cell)
                        else if (grid[checkY][checkX] !== 0xF && grid[checkY][checkX] !== Slot.NN) {
                            isValid = false;
                        }
                    }
                }

                // Only consider valid positions that overlap with at least one highlighted cell
                if (isValid && overlapCount > 0) {
                    // Check if this position is already in our list
                    const existingPos = possiblePositions.find(p => p.x === pos.x && p.y === pos.y);
                    if (!existingPos) {
                        possiblePositions.push({ ...pos, overlapCount });
                    }
                }
            });
        });

        // Sort by overlap count (descending) to find the position with most overlap
        possiblePositions.sort((a, b) => b.overlapCount - a.overlapCount);

        // Return the best position or null if none found
        return possiblePositions.length > 0 ? { x: possiblePositions[0].x, y: possiblePositions[0].y } : null;
    }
}

class _Card {
    id: number;
    slots: Slot[] = [];

    /**
     * Examples of usage
     * Rotation    00       01       02       03       04   
     * Slots    [q0][q1] [q2][q0] [q3][q2] [q1][q3] [q0][q1]
     *          [q2][q3] [q3][q1] [q1][q0] [q0][q2] [q2][q3]
     * @param rotation the rotation in iterations in clockwise direction
     */
    public getSlots(rotation: number = 0): Slot[] {
        const slots = this.slots;
        const effectiveRotation = ((rotation % 4) + 4) % 4;
        switch (effectiveRotation) {
            case 0:
                return [slots[0], slots[1], slots[2], slots[3]];
            case 1:
                return [slots[2], slots[0], slots[3], slots[1]];
            case 2:
                return [slots[3], slots[2], slots[1], slots[0]];
            case 3:
                return [slots[1], slots[3], slots[0], slots[2]];
            default:
                throw new Error("Invalid rotation");
        }
    }

    constructor(id: number = 0, q0: Slot, q1: Slot, q2: Slot, q3: Slot) {
        this.id = id;
        this.slots[0] = q0;
        this.slots[1] = q1;
        this.slots[2] = q2;
        this.slots[3] = q3;
    }
}

export class Cards {
    static 0 = new _Card(0, Slot.EE, Slot.EE, Slot.EE, Slot.EE);
    static 1 = new _Card(1, Slot.F1, Slot.W1, Slot.B2, Slot.S1);
    static 2 = new _Card(2, Slot.S2, Slot.F1, Slot.W1, Slot.B1);
    static 3 = new _Card(3, Slot.B1, Slot.W2, Slot.S1, Slot.F1);
    static 4 = new _Card(4, Slot.W1, Slot.S1, Slot.F1, Slot.C2);
    static 5 = new _Card(5, Slot.C1, Slot.B1, Slot.W1, Slot.S1);
    static 6 = new _Card(6, Slot.W1, Slot.C1, Slot.B1, Slot.F1);
    static 7 = new _Card(7, Slot.F2, Slot.S1, Slot.B1, Slot.W1);
    static 8 = new _Card(8, Slot.F1, Slot.W1, Slot.C1, Slot.B1);
    static 9 = new _Card(9, Slot.B2, Slot.EE, Slot.F2, Slot.W1);
    static 10 = new _Card(10, Slot.F1, Slot.S2, Slot.EE, Slot.W2);
    static 11 = new _Card(11, Slot.EE, Slot.B2, Slot.W1, Slot.F2);
    static 12 = new _Card(12, Slot.S2, Slot.EE, Slot.W2, Slot.F1);
    static 13 = new _Card(13, Slot.B1, Slot.C2, Slot.F1, Slot.W1);
    static 14 = new _Card(14, Slot.W1, Slot.F1, Slot.S1, Slot.C1);
    static 15 = new _Card(15, Slot.W1, Slot.B2, Slot.S1, Slot.F1);
    static 16 = new _Card(16, Slot.F1, Slot.W1, Slot.B1, Slot.S2);
    static 17 = new _Card(17, Slot.W2, Slot.S1, Slot.F1, Slot.B1);
    static 18 = new _Card(18, Slot.S1, Slot.F1, Slot.C2, Slot.W1);
    static 19 = new _Card(19, Slot.B1, Slot.W1, Slot.S1, Slot.C1);
    static 20 = new _Card(20, Slot.C1, Slot.B1, Slot.F1, Slot.W1);
    static 21 = new _Card(21, Slot.S1, Slot.B1, Slot.W1, Slot.F2);
    static 22 = new _Card(22, Slot.W1, Slot.C1, Slot.B1, Slot.F1);
    static 23 = new _Card(23, Slot.EE, Slot.F2, Slot.W1, Slot.B2);
    static 24 = new _Card(24, Slot.S2, Slot.EE, Slot.F1, Slot.W2);
    static 25 = new _Card(25, Slot.B2, Slot.W1, Slot.F2, Slot.EE);
    static 26 = new _Card(26, Slot.EE, Slot.W2, Slot.F1, Slot.S2);
    static 27 = new _Card(27, Slot.W2, Slot.F1, Slot.B1, Slot.W1);
    static 28 = new _Card(28, Slot.S1, Slot.F1, Slot.F2, Slot.W1);
    static 29 = new _Card(29, Slot.F2, Slot.W1, Slot.W1, Slot.F1);
    static 30 = new _Card(30, Slot.S2, Slot.W1, Slot.F2, Slot.EE);
    static 31 = new _Card(31, Slot.F2, Slot.EE, Slot.C1, Slot.F1);
    static 32 = new _Card(32, Slot.B2, Slot.W1, Slot.F1, Slot.S1);
    static 33 = new _Card(33, Slot.W1, Slot.F1, Slot.S2, Slot.B1);
    static 34 = new _Card(34, Slot.W1, Slot.F1, Slot.B1, Slot.W2);
    static 35 = new _Card(35, Slot.W1, Slot.F2, Slot.S1, Slot.B1);
    static 36 = new _Card(36, Slot.W2, Slot.B2, Slot.EE, Slot.F1);
    static 37 = new _Card(37, Slot.EE, Slot.W1, Slot.F2, Slot.S2);
    static 38 = new _Card(38, Slot.W1, Slot.C1, Slot.EE, Slot.W2);
    static 39 = new _Card(39, Slot.EE, Slot.F2, Slot.W2, Slot.B1);
    static 40 = new _Card(40, Slot.W2, Slot.S1, Slot.EE, Slot.F2);
    static 41 = new _Card(41, Slot.B1, Slot.EE, Slot.F2, Slot.W2);
    static 42 = new _Card(42, Slot.F2, Slot.EE, Slot.W2, Slot.S1);
    static 43 = new _Card(43, Slot.F1, Slot.C2, Slot.S1, Slot.B1);
    static 99 = new _Card(99, Slot.S1, Slot.W1, Slot.B1, Slot.F1);
    static 100 = new _Card(100, Slot.F2, Slot.C1, Slot.F1, Slot.W1);
    static 101 = new _Card(101, Slot.B1, Slot.C2, Slot.F1, Slot.S2);
    static 102 = new _Card(102, Slot.W2, Slot.S1, Slot.C1, Slot.F1);
    static 103 = new _Card(103, Slot.W1, Slot.S1, Slot.B2, Slot.S1);
}
