export enum Casilla {
    AF1,
    AF2,
    AM1,
    AM2,
    DF1,
    DF2,
    DM1,
    DM2,
    MP1,
    M2,
    PM1,
    P2,
    _1,
    _2,
    EC,
    NLL
}

export interface Player extends BGA.GamePlayer {
    position: number;
}