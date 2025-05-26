/*
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * RegroupChickenArmy implementation : © Teshynil me@teshynil.dev
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

/**
 * See {@link ../../node_modules/bga-ts-template/docs/typescript/index.md} for a LOT more information on this file.
 * The file include alternative ways to structure this file, how to break it up into multiple files, and more.
 */

// Defines the name of this module. Same as putting this code into a file at path: bgagame/regroupchickenarmy.ts
/// <amd-module name="bgagame/regroupchickenarmy"/>

import Gamegui = require("ebg/core/gamegui");
import CommonMixer = require("cookbook/common");
import "ebg/counter";
import "./modules/thirdparty/scrollmapWithZoom";

import { delay } from "./framework/utils/gameUtils";
import { Board } from "./modules/board";
import { PlayerArea } from "./modules/playerArea";
import { MarketArea } from "./modules/marketArea";
import { LeaderSelection } from "./modules/leaderSelection";
import { Player } from "./definitions";
import { Cards } from "./modules/cards";
import { Logger } from "./framework/core/logger";
import { StateId } from "./build/states";


/** See Gamegui for more information. */
export class RegroupChickenArmy extends CommonMixer(Gamegui) {
  static game: RegroupChickenArmy;
  leaders_id: { [key: string]: number; } = {};
  board: Board = new Board();

  leader_colors = [
    "ffa500",
    "0000ff",
    "ff0000",
    "008000",
  ];

  // Convenience getters for accessing components through the board
  get marketArea(): MarketArea { return this.board.centralArea.marketArea; }
  get leaderSelection(): LeaderSelection { return this.board.centralArea.leaderSelection; }
  get playerAreas(): PlayerArea[] { return this.board.playerAreas; }

  /** See Gamegui for more information. */
  constructor() {
    super();
    // Initialize the Logger with a custom prefix
    Logger.initialize('RCA');
    Logger.info("RegroupChickenArmy constructor");
    RegroupChickenArmy.game = this;
  }

  /** See Gamegui#setup for more information. */
  override setup(gamedatas: BGA.Gamedatas): void {
    Logger.info("Starting game setup");
    // Setting up player boards
    this.board.render();

    //@ts-ignore
    window.grids = {};

    this.board.isActive = this.isCurrentPlayerActive();

    this.renderGui(gamedatas);
    // Setup game notifications to handle (see "setupNotifications" method below)
    this.setupNotifications();

    Logger.info("Ending game setup");
  }

  renderGui(gamedatas: BGA.Gamedatas) {

    let player_id: BGA.ID;
    for (player_id in gamedatas.players) {
      const player = gamedatas.players[player_id] as Player;
      const leaderId = player.leader_id;
      if (leaderId !== null) {
        gamedatas.players[player_id].color = this.leader_colors[leaderId];
        const playerArea = this.playerAreas.at(leaderId);
        this.leaderSelection.leaders[leaderId].destroy();
        this.leaderSelection.leaders[leaderId] = null;
        playerArea.show();
        playerArea.panel.resourcePanel.playerName = player.name;
        this.board.backgrounds.at(leaderId).isActive = true;
        this.leaders_id[player_id] = Number(leaderId);
        playerArea.panel.leaderPanel.hasPlayerToken = player.is_first == 1;
        if (player.eliminated == 1) {
          playerArea.eliminatePlayer();
        }
      }
    }

    // Render board cards from saved state
    if (gamedatas.boards_moves) {
      for (const boardId of Object.keys(gamedatas.boards_moves) as unknown as number[]) {
        const boardData = gamedatas.boards_moves[boardId];
        this.playerAreas.at(boardId).grid.render();
        for (const movementId in boardData) {
          if (boardData[movementId].card_id) {
            this.playerAreas.at(boardData[movementId].board_id).grid.addCardToGrid(
              boardData[movementId].card_id,
              boardData[movementId].x,
              boardData[movementId].y,
              boardData[movementId].rotation
            );
            this.playerAreas.at(boardData[movementId].board_id).grid.createCardOnGrid(
              boardData[movementId].card_id,
              boardData[movementId].x,
              boardData[movementId].y,
              boardData[movementId].rotation
            );
          }
        }
      }
    }

    this.marketArea.render();
    // Simulate a market update
    this.board.centralArea.marketArea.doUpdateMarket(gamedatas["market"]);

    if (gamedatas.gamestate.id > StateId["prepareBoards"]) { // Check if we are already playing the game
      this.board.centralArea.leaderSelection.destroy();
      const player = gamedatas.players[this.player_id] as Player;
      if (this.board.isActive) {
        if (player.marketCardPicked !== null) {
          this.board.centralArea.marketArea.preSelectCard(-1, player.marketCardPicked);
        }
      }
      const resources = gamedatas["resources"];
      for (const leaderId in resources) {
        this.board.doUpdateResources({
          leader_id: Number(leaderId),
          resources: resources[leaderId]
        } as unknown as BGA.Notif<"resourcesUpdated">["args"]);
      }
      const playerAreasToRemove = [...this.playerAreas];
      for (player_id in gamedatas.players) {
        const leaderId = this.leaders_id[player_id];
        if (leaderId !== null) {
          playerAreasToRemove[leaderId] = null;

        }
      }
      for (const playerArea of playerAreasToRemove) {
        if (playerArea == null) continue;
        const id = playerArea.id;
        playerArea.destroy();
        this.playerAreas[id] = null;
      }
      for (const playerArea of this.playerAreas) {
        if (playerArea == null) continue;
        playerArea.grid.resizeGrid();
      }
    }
    for (player_id in gamedatas.players) {
      const player = gamedatas.players[player_id] as Player;
      const leaderId = player.leader_id;
      if (leaderId !== null) {
        const playerArea = this.playerAreas.at(leaderId);
        if (player.eliminated == 1) {
          playerArea.eliminatePlayer();
        }
      }
    }
  }

  getLeaderIdFromPlayerId(id: number = undefined): number {
    if (id == undefined) {
      id = Number(this.player_id);
    }
    return this.leaders_id[id];
  }

  getPlayerIdFromLeaderId(id: number = undefined): number {
    if (id == undefined) {
      id = Number(this.player_id);
    }
    const playerId = Object.keys(this.leaders_id).find(key => this.leaders_id[key] === id);
    return Number(playerId);
  }

  ///////////////////////////////////////////////////
  //// Game & client states

  /** See Gamegui#onEnteringState for more information. */
  override async onEnteringState(
    ...[stateName, _state]: BGA.GameStateTuple<["name", "state"]>
  ): Promise<void> {
    Logger.debug("Entering state: " + stateName);

    this.board.isActive = this.isCurrentPlayerActive();
    this.board.waitAnimations();
    if (_state.id > StateId["prepareBoards"]) {
      for (const playerArea of this.playerAreas) {
        if (playerArea == null) continue;
        playerArea.grid.resizeGrid();
      }
    }
    switch (stateName) {
      case "leaderSelection":
        this.board.centralArea.marketArea.hide();
        this.board.centralArea.leaderSelection.show();
        this.board.centralArea.leaderSelection.markAsSelectable(this.board.isActive);
        break;
      case "leaderSelectionGame":
        break;
      case "prepareBoards":
        break;
      case "roundSetup":
        this.board.stopAttackPhase();
        this.marketArea.enableEvents();
        this.marketArea.element.classList.remove("marketUnavailable");
        this.marketArea.element.classList.remove("deckCardPicked");
        break;
      case "playerTurn":
        this.marketArea.prepareAvailableCards();
        break;
      case "playerTurnGame":
        break;
      case "atkPhase":
        this.marketArea.disableEvents();
        this.marketArea.element.classList.add("marketUnavailable");
        this.board.startAttackPhase();
        break;
      case "healingPhase":
        break;
      case "gameEnd":
        break;
    }
  }


  /** See Gamegui#onLeavingState for more information. */
  override onLeavingState(stateName: BGA.ActiveGameState["name"]): void {
    Logger.info("Leaving state: " + stateName);

    switch (stateName) {
      case "leaderSelection":
        break;
    }
  }

  /** See Gamegui#onUpdateActionButtons for more information. */
  override onUpdateActionButtons(
    ...[stateName, args]: BGA.GameStateTuple<["name", "args"]>
  ): void {
    Logger.debug("onUpdateActionButtons: " + stateName, args);

    this.board.isActive = this.isCurrentPlayerActive();

    if (!this.board.isActive) {
      return;
    }

    switch (stateName) {
      case "atkPhase":
        break;
      case "healingPhase":
        break;
    }
  }

  ///////////////////////////////////////////////////
  //// Utility methods


  override format_string_recursive(template: string, args: Record<string, any> & { i18n?: Record<string, any>; type?: string | "chatmessage" | "tablechat" | "privatechat" | "groupchat"; message?: string; text?: string; }): string {
    try {
      if (template && args && !args["processed"]) {
        args["processed"] = true;

        const keys = {
          'attack_results': (value: string) => {
            const attackResults = args["attack_results"] as BGA.Notif<"attackExecuted">["args"]["attack_results"];
            const rows = [];
            for (const defenderResult of Object.values(attackResults)) {
              const defenderName = gameui.getFormattedPlayerName(defenderResult.defender_id);
              const oldHealth = defenderResult.new_health + defenderResult.total_damage;
              rows.push(`<tr><td>${defenderName}</td><td>${oldHealth} => ${defenderResult.new_health}</td></tr>`);
            }
            return `
            <table><tbody>
            ${rows.join('')}
            </tbody></table>`
          },
          'card_id': (cardId: string) => {
            const rotation = args["rotation"];
            return `<br><div class="log-card rotatable sprite card" data-card-id="${cardId}" style="--rotation:${rotation}; --step:90deg"></div>`;
          }
        };

        //loop the keys and for each one check if the key is present on the args, and if it is, replace the argument with the execution of the asociated function with value equal to the one present in the args
        for (const key in keys) {
          if (args[key]) {
            const conversor = keys[key as keyof typeof keys];
            const formatted_key = `${key}_formatted`;
            args[formatted_key] = conversor(args[key]);
          }
        }

      }
    } catch (e) {
      Logger.error("Exception thrown in format_string_recursive", e);
    }

    return this.getInherited("format_string_recursive", { callee: this.format_string_recursive, ...arguments },).bind(this)(template, args) as string;
  }

  ///////////////////////////////////////////////////
  //// Player's action

  ///////////////////////////////////////////////////
  //// Reaction to cometD notifications

  /** See Gamegui#setupNotifications for more information. */
  override setupNotifications = () => {
  };

}

// The global 'bgagame.regroupchickenarmy' class is instantiated when the page is loaded and used as the Gamegui.
window.bgagame = { regroupchickenarmy: RegroupChickenArmy };
