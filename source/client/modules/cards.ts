import { Slot } from "../definitions";
import { DynamicGameElement } from "../utils/gameElement";

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
    private rect = {};
    private offsetX = 0;
    private offsetY = 0;
    private currentCells: Element[] = [];
    private gridCells: Element[] = [];

    set isDraggable(value: boolean) {
        if (value) {
            this.element.classList.add("draggable");
            this.addEventToElement(this.element, 'mousedown', this.onDragStart);
            this.gridCells = Array.from(document.querySelectorAll('.grid > .cell'));
        } else {
            this.element.classList.remove("draggable");
            this.removeEventListeners();
        }
    }

    onDragStart(e: MouseEvent) {
        this.isDragging = true;
        const cardElement = this.element;
        cardElement.classList.add("dragging");

        const rect = cardElement.getBoundingClientRect();

        this.rect = rect;
        this.offsetX = rect.x + (rect.width / 2.0);
        this.offsetY = rect.y + (rect.height / 2.0);

        this.onMouseMove(e);

        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseMove(e: MouseEvent) {
        if (!this.isDragging) return;

        const x = e.clientX - this.offsetX;
        const y = e.clientY - this.offsetY;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        this.detectOverlappingCells();
    }

    onMouseUp() {
        this.isDragging = false;
        this.element.style.cursor = 'grab';
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.element.style.left = `0px`;
        this.element.style.top = `0px`;
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

        // Optional: Dispatch custom event with overlapping cells
        const event = new CustomEvent('cardovercells', {
            detail: { cells: this.currentCells }
        });
        this.element.dispatchEvent(event);
    }

    clearHighlights() {
        this.gridCells.forEach(cell =>
            (cell as HTMLElement).classList.remove('highlight')
        );
        this.currentCells = [];
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