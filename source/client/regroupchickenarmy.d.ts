/*
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * RegroupChickenArmy implementation : © Teshynil me@teshynil.dev
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */
declare namespace BGA {

	/** Goto {@link Gamedatas} or hover name for info. */
	interface Gamedatas extends Record<string, any> {
		"boards": { [key: string]: { board_id: number, card_id: number, rotation: number, x: number, y: number } };
		"market": { order: number, card_id: number }[];
	}

	/** Goto {@link NotifTypes} or hover name for info. */
	interface NotifTypes {
		"leaderSelected": { player_name: string, player_id: number, leader_id: number };
		"marketUpdate": { cards: { order: number, card_id: number }[] };
		"addInitialCards": { playersCards: { [key: string]: { position: number, player_id: number, card_id: number }; } };
		"addCardToGrid": { card_id: number, rotation: number, leader_id: number, x: number, y: number };
		"deckCardPicked": { card_id: number, player_id: number, player_name: string, };
	}

	/** Goto {@link GameSpecificIdentifiers} or hover name for info. */
	interface GameSpecificIdentifiers {
		// CounterNames: 'foo' | 'bar' | 'bread' | 'butter';
	}


}

/** Custom DOM events used in the game */
declare namespace Game {
	interface BoardEventTypes {
		"cardplaced": { grid_id: number, x: number, y: number, cardId: number, rotation: number };
		"mouseHitboxCollision": { id: number, collisions: HTMLElement[] };
	}
}