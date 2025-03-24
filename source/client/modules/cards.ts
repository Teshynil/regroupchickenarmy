import { Slot } from "../definitions";
import { GameElement } from "../utils/gameElement";

export class CardElement {

    get id(): number {
        return this._id
    };

    get slots(): Slot[] {
        return this._slots
    };

    /**
     * Examples of usage
     * Rotation    00       01       02       03       04   
     * Slots    [q0][q1] [q2][q0] [q3][q2] [q1][q3] [q0][q1]
     *          [q2][q3] [q3][q1] [q1][q0] [q0][q2] [q2][q3]
     * @param rotation the rotation in iterations in clockwise direction
     */
    public getSlotsRotated(rotation: number): Slot[] {
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

    protected _id: number = 0;

    protected _slots: Slot[] = [];

    constructor(id: number = 0, q0: Slot, q1: Slot, q2: Slot, q3: Slot) {
        this._id = id;
        this._slots[0] = q0;
        this._slots[1] = q1;
        this._slots[2] = q2;
        this._slots[3] = q3;
    }


    renderCard(PARENT_ID: string, HTML_ID: string) {
        const parentElement = document.getElementById(PARENT_ID);
        if (parentElement == null) throw new Error(`Parent Element for Card ${this.id} not found`);
        parentElement.insertAdjacentHTML("beforeend", `<div id="${HTML_ID}" class="class" data-card-id="${this.id}"></div>`);
    }
}

export class Cards {
    static 0 = new CardElement(0, Slot.F1, Slot.W1, Slot.B2, Slot.S1);
    static 1 = new CardElement(1, Slot.S2, Slot.F1, Slot.W1, Slot.B1);
    static 2 = new CardElement(2, Slot.B1, Slot.W2, Slot.S1, Slot.F1);
    static 3 = new CardElement(3, Slot.W1, Slot.S1, Slot.F1, Slot.C2);
    static 4 = new CardElement(4, Slot.C1, Slot.B1, Slot.W1, Slot.S1);
    static 5 = new CardElement(5, Slot.W1, Slot.C1, Slot.B1, Slot.F1);
    static 6 = new CardElement(6, Slot.F2, Slot.S1, Slot.B1, Slot.W1);
    static 7 = new CardElement(7, Slot.F1, Slot.W1, Slot.C1, Slot.B1);
    static 8 = new CardElement(8, Slot.B2, Slot.EE, Slot.F2, Slot.W1);
    static 9 = new CardElement(9, Slot.F1, Slot.S2, Slot.EE, Slot.W2);
    static 10 = new CardElement(10, Slot.EE, Slot.B2, Slot.W1, Slot.F2);
    static 11 = new CardElement(11, Slot.S2, Slot.EE, Slot.W2, Slot.F1);
    static 12 = new CardElement(12, Slot.B1, Slot.C2, Slot.F1, Slot.W1);
    static 13 = new CardElement(13, Slot.W1, Slot.F1, Slot.S1, Slot.C1);
    static 14 = new CardElement(14, Slot.W1, Slot.B2, Slot.S1, Slot.F1);
    static 15 = new CardElement(15, Slot.F1, Slot.W1, Slot.B1, Slot.S2);
    static 16 = new CardElement(16, Slot.W2, Slot.S1, Slot.F1, Slot.B1);
    static 17 = new CardElement(17, Slot.S1, Slot.F1, Slot.C2, Slot.W1);
    static 18 = new CardElement(18, Slot.B1, Slot.W1, Slot.S1, Slot.C1);
    static 19 = new CardElement(19, Slot.C1, Slot.B1, Slot.F1, Slot.W1);
    static 20 = new CardElement(20, Slot.S1, Slot.B1, Slot.W1, Slot.F2);
    static 21 = new CardElement(21, Slot.W1, Slot.C1, Slot.B1, Slot.F1);
    static 22 = new CardElement(22, Slot.EE, Slot.F2, Slot.W1, Slot.B2);
    static 23 = new CardElement(23, Slot.S2, Slot.EE, Slot.F1, Slot.W2);
    static 24 = new CardElement(24, Slot.B2, Slot.W1, Slot.F2, Slot.EE);
    static 25 = new CardElement(25, Slot.EE, Slot.W2, Slot.F1, Slot.S2);
    static 26 = new CardElement(26, Slot.W2, Slot.F1, Slot.B1, Slot.W1);
    static 27 = new CardElement(27, Slot.S1, Slot.F1, Slot.F2, Slot.W1);
    static 28 = new CardElement(28, Slot.F2, Slot.W1, Slot.W1, Slot.F1);
    static 29 = new CardElement(29, Slot.S2, Slot.W1, Slot.F2, Slot.EE);
    static 30 = new CardElement(30, Slot.F2, Slot.EE, Slot.C1, Slot.F1);
    static 31 = new CardElement(31, Slot.B2, Slot.W1, Slot.F1, Slot.S1);
    static 32 = new CardElement(32, Slot.W1, Slot.F1, Slot.S2, Slot.B1);
    static 33 = new CardElement(33, Slot.W1, Slot.F1, Slot.B1, Slot.W2);
    static 34 = new CardElement(34, Slot.W1, Slot.F2, Slot.S1, Slot.B1);
    static 35 = new CardElement(35, Slot.W2, Slot.B2, Slot.EE, Slot.F1);
    static 36 = new CardElement(36, Slot.EE, Slot.W1, Slot.F2, Slot.S2);
    static 37 = new CardElement(37, Slot.W1, Slot.C1, Slot.EE, Slot.W2);
    static 38 = new CardElement(38, Slot.EE, Slot.F2, Slot.W2, Slot.B1);
    static 39 = new CardElement(39, Slot.W2, Slot.S1, Slot.EE, Slot.F2);
    static 40 = new CardElement(40, Slot.B1, Slot.EE, Slot.F2, Slot.W2);
    static 41 = new CardElement(41, Slot.F2, Slot.EE, Slot.W2, Slot.S1);
    static 42 = new CardElement(42, Slot.F1, Slot.C2, Slot.S1, Slot.B1);
    static 99 = new CardElement(99, Slot.S1, Slot.W1, Slot.B1, Slot.F1);
    static 100 = new CardElement(100, Slot.F2, Slot.C1, Slot.F1, Slot.W1);
    static 101 = new CardElement(101, Slot.B1, Slot.C2, Slot.F1, Slot.S2);
    static 102 = new CardElement(102, Slot.W2, Slot.S1, Slot.C1, Slot.F1);
    static 103 = new CardElement(103, Slot.W1, Slot.S1, Slot.B2, Slot.S1);
}