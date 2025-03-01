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
import "./modules/scrollmapWithZoom";

import { PlayerArea } from "./playerArea";
import { MarketArea } from "./marketArea";
import { LeaderSelection } from "./leaderSelection";
import { Player } from "./definitions";

/** See {@link BGA.Gamegui} for more information. */
export class RegroupChickenArmy extends CommonMixer(Gamegui) {
    static game: RegroupChickenArmy;
    boardDiv: HTMLDivElement;
    playerAreas: PlayerArea[] = [
        new PlayerArea(0),
        new PlayerArea(1),
        new PlayerArea(2),
        new PlayerArea(3),
    ];
    marketArea: MarketArea;
    leaderSelection: LeaderSelection;

    /** See {@link BGA.Gamegui} for more information. */
    constructor() {
        super();
        console.log("RegroupChickenArmy constructor");
        RegroupChickenArmy.game = this;
    }

    /** See {@link  BGA.Gamegui#setup} for more information. */
    override setup(gamedatas: BGA.Gamedatas): void {
        console.log("Starting game setup");

        // Setting up player boards

        document.getElementById("game_play_area").insertAdjacentHTML(
            "beforeend",
            `
			<div id="board">
			<div id="centralArea"></div>
			</div>
		  `
        );
        this.boardDiv = document.getElementById("board") as HTMLDivElement;

        let player_id: BGA.ID;
        let i = 0;
        //@ts-ignore
        window.grids = {};
        for (player_id in gamedatas.players) {
            let player = gamedatas.players[player_id] as Player;
            if (player.position !== null) {
                this.playerAreas[player.position].active = true;
            }
            i++;
        }

        if (this.isCurrentPlayerActive()) {
            this.boardDiv.classList.add("activePlayer");
        } else {
            this.boardDiv.classList.remove("activePlayer");
        }

        this.renderGui(gamedatas);
        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();

        console.log("Ending game setup");
    }

    renderGui(gamedatas: BGA.Gamedatas) {
        for (let i = 0; i < 4; i++) {
            this.playerAreas[i].render();
        }
        this.marketArea = new MarketArea();
        this.marketArea.render();
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    /** See {@link BGA.Gamegui#onEnteringState} for more information. */
    override onEnteringState(
        ...[stateName, state]: BGA.GameStateTuple<["name", "state"]>
    ): void {
        console.log("Entering state: " + stateName);

        if (this.isCurrentPlayerActive()) {
            this.boardDiv.classList.add("activePlayer");
        } else {
            this.boardDiv.classList.remove("activePlayer");
        }

        switch (stateName) {
            case "leaderSelection":
                if (this.leaderSelection == null) {
                    this.leaderSelection = new LeaderSelection();
                    this.marketArea.hide();
                }
                let player_id;
                this.leaderSelection.render();
                break;
        }
    }

    /** See {@link BGA.Gamegui#onLeavingState} for more information. */
    override onLeavingState(stateName: BGA.ActiveGameState["name"]): void {
        console.log("Leaving state: " + stateName);

        switch (stateName) {
            case "leaderSelection":
                break;
        }
    }

    /** See {@link BGA.Gamegui#onUpdateActionButtons} for more information. */
    override onUpdateActionButtons(
        ...[stateName, args]: BGA.GameStateTuple<["name", "args"]>
    ): void {
        console.log("onUpdateActionButtons: " + stateName, args);

        if (!this.isCurrentPlayerActive()) {
            this.boardDiv.classList.remove("activePlayer");
            return;
        }
        this.boardDiv.classList.add("activePlayer");

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
        console.log("notifications subscriptions setup");

        // TODO: here, associate your game notifications with local methods

        // Builtin example...
        // dojo.subscribe( 'cardPlayed_1', this, "ntf_any" );
        dojo.subscribe("leaderSelected", this, "ntf_selectLeader");
        // dojo.subscribe( 'cardPlayed_0', this, "ntf_cardPlayed" );
        // dojo.subscribe( 'cardPlayed_1', this, "ntf_cardPlayed" );

        //	With CommonMixin from 'cookbook/common'...
        //this.subscribeNotif("leaderSelected", this.ntf_selectLeader);
        // this.subscribeNotif( "actionTaken", this.ntf_actionTaken );
        // this.subscribeNotif( "cardPlayed_0", this.ntf_cardPlayed );
        // this.subscribeNotif( "cardPlayed_1", this.ntf_cardPlayed );
    };

    ntf_selectLeader(notif: BGA.Notif) {
        this.leaderSelection.select(notif.args["leader_id"] as number, true);
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
