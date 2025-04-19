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

import { delay } from "./utils/gameUtils";
import { Board } from "./modules/board";
import { PlayerArea } from "./modules/playerArea";
import { MarketArea } from "./modules/marketArea";
import { LeaderSelection } from "./modules/leaderSelection";
import { Player } from "./definitions";
import { Cards } from "./modules/cards";
import { Logger } from "./utils/logger";


/** See Gamegui for more information. */
export class RegroupChickenArmy extends CommonMixer(Gamegui) {
  static game: RegroupChickenArmy;
  leaders_id: { [key: string]: number; } = {};
  board: Board = new Board();

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

    const to_preload = [];
    for (const card_id in Cards) {
      to_preload.push(`Cards/Card_${card_id}.webp`);
    }

    this.ensureSpecificGameImageLoading(to_preload);
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
        this.board.centralArea.leaderSelection.leaders[leaderId] = null;
        this.board.backgrounds[leaderId].isActive = true;
        this.playerAreas.at(leaderId).render(true);
        this.leaders_id[player_id] = Number(leaderId);
      }
    }

    // Render board cards from saved state
    if (gamedatas.boards_moves) {
      for (const boardId in gamedatas.boards_moves) {
        const boardData = gamedatas.boards_moves[boardId];
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
        this.playerAreas.at(Number(boardId)).grid.resizeGrid();
      }
    }

    let marketCard: { order: number, card_id: number };
    let i = 2;
    for (marketCard of gamedatas["market"]) {
      this.board.centralArea.marketArea.cards[i].dataset["cardId"] = `${marketCard.card_id}`;
      i--;
    }
    if (gamedatas.gamestate.id > 4) { // Check if we are already playing the game
      const player = gamedatas.players[this.player_id] as Player;
      if (this.board.isActive) {
        if (player.marketCardPicked !== null) {
          this.board.centralArea.marketArea.preSelectCard(-1, player.marketCardPicked);
        }
      }
      const resources = gamedatas["resources"];
      for (const leaderId in resources) {
        this.playerAreas.at(Number(leaderId)).panel.resourcePanel.doUpdateResources({
          args: {
            leader_id: Number(leaderId),
            resources: resources[leaderId]
          }
        } as unknown as BGA.Notif<"resourcesUpdated">);
      }
    }
  }

  getLeaderIdFromPlayerId(id: number = undefined): number {
    if (id == undefined) {
      id = Number(this.player_id);
    }
    return this.leaders_id[id];
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
    switch (stateName) {
      case "leaderSelection":
        this.board.centralArea.marketArea.hide();
        this.board.centralArea.leaderSelection.show();
        break;
      case "leaderSelectionGame":
        break;
      case "prepareBoards":
        break;
      case "turnSetup":
        break;
      case "playerTurn":
        //TODO: this.board.centralArea.marketArea.animateDealCards();
        break;
      case "playerTurnGame":
        break;
      case "atkPhase":
        if (this.isCurrentPlayerActive()) {
          await delay(3000);
          Logger.info("Current player is active, automatically sending attack action");
          this.ajaxcall(
            `/${this.game_name}/${this.game_name}/attack.html`,
            {},
            this,
            () => {
              // Success callback
              Logger.info("Attack action sent successfully");
            },
            (error) => {
              // Error callback
              Logger.error("Attack action failed", error);
            }
          );
        } else {
          Logger.info("Current player is not active, waiting for active player to attack");
        }
        break;
      case "atkPhaseGame":
        break;
      case "healingPhase":
        break;
      case "healingPhaseGame":
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
      case "leaderSelection":
        // Add buttons to action bar...
        // this.addActionButton( 'button_id', _('Button label'), this.onButtonClicked );
        break;
    }
  }

  ///////////////////////////////////////////////////
  //// Utility methods

  ///////////////////////////////////////////////////
  //// Player's action

  ///////////////////////////////////////////////////
  //// Reaction to cometD notifications

  /** See Gamegui#setupNotifications for more information. */
  override setupNotifications = () => {
    Logger.info("notifications subscriptions setup");

    this.subscribeNotif('boardsInitialized', this.onBoardsInitialized);
    this.notifqueue.setSynchronous('boardsInitialized', 2000);
  };

  private async onBoardsInitialized(notif: BGA.Notif<"boardsInitialized">): Promise<void> {
    Logger.info("Entering Notification Boards initialized");
    await delay(1000);
    this.board.centralArea.leaderSelection.destroy();
    this.board.centralArea.marketArea.show();
    // Process initial cards
    const playerCards = notif.args.playersCards;
    dojo.publish('addInitialCards', [{
      args: {
        playersCards: playerCards
      },
    }]);

    // Process initial resources
    const playerResources = notif.args.playersResources;
    for (const leaderId in playerResources) {
      const playerArea = this.playerAreas.find(area => area.grid.id === parseInt(leaderId));
      if (playerArea) {
        const resourceData = playerResources[leaderId];
        // Trigger resource update notification manually
        dojo.publish('resourcesUpdated', [{
          args: {
            player_id: resourceData.player_id,
            leader_id: parseInt(leaderId),
            resources: resourceData.resources
          },
        }]);
      }
    }
  }

  /* Example:

  ntf_any( notif: BGA.Notif )
  {
    console.log( 'ntf_any', notif );
    notif.args!['arg_0'];
  }

  ntf_actionTaken( notif: BGA.Notif<'actionTaken'> ) {
    console.log( 'ntf_actionTaken', notif );
  }

  ntf_cardPlayed( notif: BGA.Notif<'cardPlayed_0' | 'cardPlayed_1'> )
  {
    console.log( 'ntf_cardPlayed', notif );
    switch( notif.type ) {
      case 'cardPlayed_0':
        notif.args.arg_0;
        break;
      case 'cardPlayed_1':
        notif.args.arg_1;
        break;
    }
  }

  */
}

// The global 'bgagame.regroupchickenarmy' class is instantiated when the page is loaded and used as the Gamegui.
window.bgagame = { regroupchickenarmy: RegroupChickenArmy };
