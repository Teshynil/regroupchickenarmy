import { RegroupChickenArmy } from "../regroupchickenarmy";
import { Animator } from "../framework/animations/animator";
import { ListenerConfig } from "../framework/core/types";
import { GameElement } from "../framework/elements/gameElement";
import { delay } from "../framework/utils/gameUtils";
import { ListenerElement } from "../framework/elements/listenerElement";
import { Logger } from "../framework/core/logger";
import { CentralArea } from "./centralArea";
import { PlayerArea } from "./playerArea";

export class Board extends ListenerElement {
    PARENT_ID = `game_play_area`;
    ELEMENT_ID = `board`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}"></div>`;

    get listeners(): ListenerConfig {
        return {
            "firstPlayerSelected": { callback: this.doFirstPlayerSelected },
            "addInitialCards": { callback: this.doAddInitialsCards },
            "attackExecuted": { callback: this.doAttackExecuted },
            "resourcesUpdated": { callback: this.doUpdateResources },
            "healExecuted": { callback: this.doHealExecuted },
            "leaderEliminated": { callback: this.doLeaderEliminated }
        }
    };

    backgrounds: PlayerBackground[] = [];
    centralArea: CentralArea;
    playerAreas: PlayerArea[] = [];

    constructor() {
        super();

        // Initialize child components with this as parent
        this.backgrounds = [
            PlayerBackground.createChild(this, 0),
            PlayerBackground.createChild(this, 1),
            PlayerBackground.createChild(this, 2),
            PlayerBackground.createChild(this, 3)
        ];

        this.centralArea = CentralArea.createChild(this);

        this.playerAreas = [
            PlayerArea.createChild(this, 0),
            PlayerArea.createChild(this, 1),
            PlayerArea.createChild(this, 2),
            PlayerArea.createChild(this, 3)
        ];
    }

    public override afterRenderAll(_force: boolean): void {
        // Children are automatically rendered by the parent class

        // Hide player areas initially
        this.playerAreas.forEach(playerArea => {
            playerArea.hide();
        });
    }

    set isActive(val: boolean) {
        if (val) {
            this.element.classList.add("activePlayer");
        } else {
            this.element.classList.remove("activePlayer");
        }
    }

    get isActive(): boolean {
        return this.element.classList.contains("activePlayer");
    }

    public async waitAnimations(): Promise<void> {
        const timeout = 3000;
        const startTime = Date.now();

        return new Promise((resolve) => {
            const checkAnimation = () => {
                if (Animator.instance.isQueueEmpty || Date.now() - startTime >= timeout) {
                    resolve();
                } else {
                    setTimeout(checkAnimation, 200); // Check every 200ms
                }
            };

            checkAnimation();
        });
    }

    async doFirstPlayerSelected(notif: BGA.Notif<"firstPlayerSelected">) {
        for (const playerArea of this.playerAreas) {
            if (playerArea == null) continue;
            playerArea.panel.leaderPanel.hasPlayerToken = false;
        }
        const leaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(notif.args.player_id);
        this.playerAreas.at(leaderId).panel.leaderPanel.hasPlayerToken = true;
        return new Promise(resolve => setTimeout(resolve, 1));
    }

    async doAddInitialsCards(notif: BGA.Notif<"addInitialCards">) {
        const playersCards = notif.args.playersCards;
        for (const leaderData of Object.values(playersCards)) {
            const leaderId = leaderData.leader_id;
            const playerArea = this.playerAreas.at(leaderId);
            const grid = playerArea.grid;
            grid.addInitialCard(leaderData.card_id);
        }
        return delay(1000);
    }

    async doAttackExecuted(notif: BGA.Notif<"attackExecuted">) {
        const attackerLeaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(notif.args.player_id);

        //@ts-ignore
        const attackerNameFormatted = RegroupChickenArmy.game.getFormattedPlayerName(notif.args.player_id);

        const attackerName = RegroupChickenArmy.game.getPlayerName(notif.args.player_id);

        Logger.info(`Attack executed by ${attackerName} (${attackerLeaderId})`);
        const results = notif.args.attack_results;
        const delayTime = Math.min(1800, 5000 / Object.keys(results).length);
        for (const defenderResult of Object.values(results)) {
            const defenderId = defenderResult.defender_id;
            //@ts-ignore
            const defenderName = RegroupChickenArmy.game.getFormattedPlayerName(defenderId);
            const defenderLeaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(Number(defenderId));
            Logger.warn(`Defender ${defenderResult.defender_name} (${defenderLeaderId}) received ${defenderResult.total_damage} damage from ${attackerName} (${attackerLeaderId})`);
            const defenderPanel = this.playerAreas.at(defenderLeaderId).panel;
            const physicalDamage = defenderResult.physical_damage;
            const magicalDamage = defenderResult.magical_damage;
            const totalDamage = defenderResult.total_damage;
            const newHealth = defenderResult.new_health;
            //@ts-ignore
            RegroupChickenArmy.game.statusBar.setTitle("${attacker} Attacks ${defender} doing them ${damage} points of damage", { attacker: attackerNameFormatted, defender: defenderName, damage: totalDamage });
            await defenderPanel.receiveAttack(attackerLeaderId, newHealth, physicalDamage, magicalDamage, delayTime);
        }
        return new Promise(resolve => setTimeout(resolve, 1));
    }

    async doHealExecuted(notif: BGA.Notif<"healExecuted">) {
        Logger.info("Heal executed");
        const leaderId = notif.args.leader_id;
        const leaderPanel = this.playerAreas.at(leaderId).panel;
        await leaderPanel.heal(notif.args.heal_amount, 800);
        return new Promise(resolve => setTimeout(resolve, 1));
    }

    async doLeaderEliminated(notif: BGA.Notif<"leaderEliminated">) {
        // Find the player area for the eliminated player
        const leaderId = notif.args.leader_id;
        const playerArea = this.playerAreas.at(leaderId);
        playerArea.eliminatePlayer();
        return new Promise(resolve => setTimeout(resolve, 1));
    }

    async doUpdateResources(notif: BGA.Notif<"resourcesUpdated">) {
        const leaderId = notif.args.leader_id;
        const resources = notif.args.resources;

        const leaderPanel = this.playerAreas.at(leaderId).panel.leaderPanel;
        const resourcePanel = this.playerAreas.at(leaderId).panel.resourcePanel;

        // Update all resource counters
        resourcePanel.shieldElement.innerText = resources.shield.toString();
        resourcePanel.fighterElement.innerText = resources.fighter.toString();
        resourcePanel.barrierElement.innerText = resources.barrier.toString();
        resourcePanel.wizardElement.innerText = resources.wizard.toString();
        resourcePanel.potionElement.innerText = resources.potion.toString();
        resourcePanel.coinElement.innerText = resources.coin.toString();

        leaderPanel.health = resources.health;
        return new Promise(resolve => setTimeout(resolve, 1));
    }

}


class PlayerBackground extends GameElement {
    PARENT_ID = "board";
    ELEMENT_ID = `playerBackground_${this.id}`;

    HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}" class="playerBackground"></div>`;


    public override afterRenderThis(_force: boolean): void {
        this.isActive = false;
    }

    set isActive(val: boolean) {
        if (!val) {
            this.element.classList.add("inactive");
        } else {
            this.element.classList.remove("inactive");
        }
    }
}