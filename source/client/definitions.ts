export enum Casilla {
    F1,
    F2,
    W1,
    W2,
    S1,
    S2,
    B1,
    B2,
    C1,
    C2,
    P1,
    P2,
    _1,
    _2,
    EE,
    NN
}

export interface Player extends BGA.GamePlayer {
    position: number;
}