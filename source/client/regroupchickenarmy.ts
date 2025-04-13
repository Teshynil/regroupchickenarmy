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

import { registerExtensions } from "./utils/extensions";
import { delay } from "./utils/gameUtils";
import { Board } from "./modules/board";
import { PlayerArea } from "./modules/playerArea";
import { MarketArea } from "./modules/marketArea";
import { LeaderSelection } from "./modules/leaderSelection";
import { Player } from "./definitions";
import { Cards } from "./modules/cards";
import { logger } from "./utils/logger";

registerExtensions();

/** See {@link BGA.Gamegui} for more information. */
export class RegroupChickenArmy extends CommonMixer(Gamegui) {
  static game: RegroupChickenArmy;
  leaders_id: { [key: string]: number; } = {};
  board: Board = new Board();
  playerAreas: PlayerArea[];
  marketArea: MarketArea;
  leaderSelection: LeaderSelection;

  /** See {@link BGA.Gamegui} for more information. */
  constructor() {
    super();
    // Initialize the logger with a custom prefix
    logger.initialize('RCA');
    logger.info("RegroupChickenArmy constructor");
    RegroupChickenArmy.game = this;
  }

  /** See {@link  BGA.Gamegui#setup} for more information. */
  override setup(gamedatas: BGA.Gamedatas): void {
    logger.info("Starting game setup");
    // Setting up player boards
    this.board.render();

    this.playerAreas = [new PlayerArea(0), new PlayerArea(1), new PlayerArea(2), new PlayerArea(3)];

    //@ts-ignore
    window.grids = {};
    this.marketArea = new MarketArea();
    this.leaderSelection = new LeaderSelection();

    this.board.isActive = this.isCurrentPlayerActive();

    const to_preload = [];
    for (const card_id in Cards) {
      to_preload.push(`Cards/Card_${card_id}.webp`);
    }

    this.ensureSpecificGameImageLoading(to_preload);
    this.renderGui(gamedatas);
    // Setup game notifications to handle (see "setupNotifications" method below)
    this.setupNotifications();

    logger.info("Ending game setup");
  }

  renderGui(gamedatas: BGA.Gamedatas) {
    this.marketArea.render();
    for (let i = 0; i < 4; i++) {
      this.playerAreas.at(i).panel.render();
      this.playerAreas.at(i).panel.hide();
    }

    let player_id: BGA.ID;
    for (player_id in gamedatas.players) {
      const player = gamedatas.players[player_id] as Player;
      const leaderId = player.leader_id;
      if (leaderId !== null) {
        this.leaderSelection.leaders[leaderId] = null;
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
      }
    }

    let marketCard: { order: number, card_id: number };
    let i = 2;
    for (marketCard of gamedatas["market"]) {
      this.marketArea.cards[i].dataset["cardId"] = `${marketCard.card_id}`;
      i--;
    }
    if (gamedatas.gamestate.id > 4) { // Check if we are already playing the game
      const player = gamedatas.players[this.player_id] as Player;
      if (this.board.isActive) {
        if (player.marketCardPicked !== null) {
          this.marketArea.preSelectCard(-1, player.marketCardPicked);
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

  /** See {@link BGA.Gamegui#onEnteringState} for more information. */
  override async onEnteringState(
    ...[stateName, _state]: BGA.GameStateTuple<["name", "state"]>
  ): Promise<void> {
    logger.debug("Entering state: " + stateName);


    this.board.isActive = this.isCurrentPlayerActive();
    await this.board.waitAnimations();
    switch (stateName) {
      case "leaderSelection":
        this.marketArea.hide();
        this.leaderSelection.render();
        break;
      case "leaderSelectionGame":
        break;
      case "turnSetup":
        break;
      case "playerTurn":
        await delay(2000); // Delay to avoid hiding the leader cards while still animating
        this.leaderSelection.destroy();
        this.marketArea.show();
        //TODO: this.marketArea.animateDealCards();
        break;
      case "playerTurnGame":
        break;
      case "atkPhase":
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

  /** See {@link BGA.Gamegui#onLeavingState} for more information. */
  override onLeavingState(stateName: BGA.ActiveGameState["name"]): void {
    logger.info("Leaving state: " + stateName);

    switch (stateName) {
      case "leaderSelection":
        break;
    }
  }

  /** See {@link BGA.Gamegui#onUpdateActionButtons} for more information. */
  override onUpdateActionButtons(
    ...[stateName, args]: BGA.GameStateTuple<["name", "args"]>
  ): void {
    logger.debug("onUpdateActionButtons: " + stateName, args);

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

  /*
    Here, you are defining methods to handle player's action (ex: results of mouse click on game objects).

    Most of the time, these methods:
    - check the action is possible at this game state.
    - make a call to the game server
  */

  /* Example:

  onButtonClicked( evt: Event )
  {
    console.log( 'onButtonClicked' );

    // Preventing default browser reaction
    evt.preventDefault();

    // Builtin example...
    if(this.checkAction( 'myAction' ))
    {
      this.ajaxcall(
        `/${this.game_name!}/${this.game_name!}/myAction.html`,
        {
          lock: true,
          myArgument1: arg1,
          myArgument2: arg2,
        },
        this,
        function( server_response: unknown ) {
          // Callback only on success (no error)
          // (for player actions, this is almost always empty)
        }, function(error: boolean, errorMessage?: string, errorCode?: number) {
          // What to do after the server call in anyway (success or failure)
          // (usually catch unexpected server errors)
        },
      );
    }

    // Builtin example with new BGA wrapper...
    this.bgaPerformAction( 'myAction', { myArgument1: arg1, myArgument2: arg2 } );

    //	With CommonMixin from 'cookbook/common'...
    this.ajaxAction(
      'myAction',
      { myArgument1: arg1, myArgument2: arg2 },
      function(error: boolean, errorMessage?: string, errorCode?: number) {
        // What to do after the server call in anyway (success or failure)
        // (usually catch unexpected server errors)
      }
    );
  }

  */

  ///////////////////////////////////////////////////
  //// Reaction to cometD notifications

  /** See {@link BGA.Gamegui#setupNotifications} for more information. */
  override setupNotifications = () => {
    logger.info("notifications subscriptions setup");

    this.subscribeNotif('boardsInitialized', this.onBoardsInitialized);
  };

  private async onBoardsInitialized(notif: BGA.Notif<"boardsInitialized">): Promise<void> {
    logger.info("Entering Notification Boards initialized");

    await delay(3000);

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
