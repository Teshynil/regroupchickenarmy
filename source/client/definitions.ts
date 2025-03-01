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

export interface Player {
    /** The unique identifier for the player. */
    id: number | `${number}`;
    /** This players current score. This is the score updated by game specific code in the `.game.php` file */
    score: number | `${number}`;
    /** The color of the player as defined in `gameinfos.inc.php` assigned by the `.game.php` file. This should always be a hex string in RGB format: `RRGGBB`. */
    color: string;
    /** Not documented. This should always be a hex string in RGB format: `RRGGBB`. */
    color_back: string | null;
    /** The username of the player. */
    name: string;
    /** Not documented. */
    avatar: string | '000000';
    /** Not documented. Presumably represents if the player has disconnected and has begun taking 'zombie' actions. This is likely a boolean. */
    zombie: '0' | '1' | 0 | 1;
    /** Not documented. */
    eliminated: '0' | '1' | 0 | 1;
    /** Not documented. Presumably represents if the player is a bot. This is likely a boolean. */
    is_ai: '0' | '1' | 0 | 1;
    /** Not documented. This could represent a beginner to BGA or the game, and unsure how this is calculated. */
    beginner: boolean;
    /** Not documented. */
    ack?: string | 'ack';
    /** Not documented. */
    no?: string;
    // Custom properties

    position: number;
}