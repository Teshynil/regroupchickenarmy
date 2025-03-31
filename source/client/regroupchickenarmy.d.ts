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
		"boards_moves": { [key: string]: { [key: string]: { board_id: number, movement_id: number, card_id: number, rotation: number, x: number, y: number } } };
		"market": { order: number, card_id: number }[];
		"resources": { [leaderId: string]: { fighter: number, wizard: number, shield: number, barrier: number, potion: number, coin: number } };
	}

	/** Goto {@link NotifTypes} or hover name for info. */
	interface NotifTypes {
		"leaderSelected": { player_name: string, player_id: number, leader_id: number };
		"marketUpdate": { cards: { order: number, card_id: number }[] };
		"addInitialCards": { playersCards: { [leaderId: string]: { leader_id: number, player_id: number, card_id: number } } };
		"addCardToGrid": { card_id: number, rotation: number, leader_id: number, x: number, y: number };
		"deckCardPicked": { card_id: number, player_id: number, player_name: string, };
		"resourcesUpdated": { player_id: number, leader_id: number, resources: { 
			fighter: number, 
			wizard: number, 
			shield: number, 
			barrier: number, 
			potion: number, 
			coin: number
		} };
		"boardsInitialized": { 
			playersCards: { [leaderId: string]: { leader_id: number, player_id: number, card_id: number } },
			playersResources: { [leaderId: string]: { 
				player_id: number, 
				resources: { 
					fighter: number, 
					wizard: number, 
					shield: number, 
					barrier: number, 
					potion: number, 
					coin: number 
				} 
			} }
		};
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
