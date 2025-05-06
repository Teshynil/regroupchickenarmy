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
		"boards_moves": { [key: number]: { [key: number]: { board_id: number, movement_id: number, card_id: number, rotation: number, x: number, y: number } } };
		"market": { order: number, card_id: number }[];
		"resources": { [leaderId: string]: { fighter: number, wizard: number, shield: number, barrier: number, potion: number, coin: number } };
	}

	/** Goto {@link NotifTypes} or hover name for info. */
	interface NotifTypes {
		"leaderSelected": { player_name: string, player_id: number, leader_id: number };
		"marketUpdate": {
			cards: {
				order: number, card_id: number
			}[],
			cardsInDeck: number
		};
		"addInitialCards": { playersCards: { [leaderId: string]: { leader_id: number, player_id: number, card_id: number } } };
		"cardPlaced": {
			player_name: string,
			player_id: number,
			board_id: number,
			card_id: number,
			rotation: number,
			x: number,
			y: number,
			isDeckCard: boolean
		};
		"deckCardPicked": { card_id: number, player_id: number, player_name: string, };
		"resourcesUpdated": {
			player_id: number, leader_id: number, resources: {
				fighter: number,
				wizard: number,
				shield: number,
				barrier: number,
				potion: number,
				coin: number,
				health: number
			}
		};
		"boardsInitialized": {
			playersCards: { [leaderId: string]: { leader_id: number, player_id: number, card_id: number } },
			playersResources: {
				[leaderId: string]: {
					player_id: number,
					resources: {
						fighter: number,
						wizard: number,
						shield: number,
						barrier: number,
						potion: number,
						coin: number
					}
				}
			}
		};
		"firstPlayerSelected": { player_name: string, player_id: number };
		"attackExecuted": {
			leader_id: number,
			player_name: string,
			player_id: number,
			physical_attack: number,
			magical_attack: number,
			attack_results: {
				[player_id: string]: {
					leader_id: number,
					defender_id: number,
					defender_name: string,
					physical_damage: number,
					magical_damage: number,
					total_damage: number,
					new_health: number
				}
			}
		};
		"leaderEliminated": {
			player_name: string,
			player_id: number,
			leader_id: number,
			health: number
		};
		"gameWinner": {
			player_name: string,
			player_id: number,
			health?: number
		};
		"healExecuted": {
			player_name: string,
			player_id: number,
			leader_id: number,
			heal_amount: number,
			new_health: number
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
		"cardPrePlaced": { grid_id: number, x: number, y: number, cardId: number, rotation: number };
		"mouseHitboxCollision": { id: number, collisions: HTMLElement[] };
	}
}
