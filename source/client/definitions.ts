export enum Slot {
    F1, //Fighter x 1
    F2, //Fighter x 2
    W1, //Wizard x 1
    W2, //Wizard x 2
    S1, //Shield x 1
    S2, //Shield x 2
    B1, //Barrier x 1
    B2, //Barrier x 2
    M1, //Coin and Potion x 1
    C2, //Coin x 2
    P1, //Potion x 1
    P2, //Potion x 2
    _1, //Unused
    _2, //Unused
    EE, //Empty slot
    NN, //Null
}

export interface Player extends BGA.GamePlayer {
    leader_id: number;
    marketCardPicked: number | null;
    is_first: number;
    is_dead: number;
}
