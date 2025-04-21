import { RegroupChickenArmy } from "../regroupchickenarmy";
import { Animator } from "../utils/animations/animator";
import { ListenerConfig } from "../utils/definitions";
import { GameElement } from "../utils/gameElement";
import { delay } from "../utils/gameUtils";
import { ListenerElement } from "../utils/listenerElement";
import { Logger } from "../utils/logger";
import { CentralArea } from "./centralArea";
import { PlayerArea } from "./playerArea";

export class Board extends ListenerElement {
    PARENT_ID = `game_play_area`;
    ELEMENT_ID = `board`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}"></div>`;

    get listeners(): ListenerConfig {
        return {
            "firstPlayerSelected": { callback: this.doFirstPlayerSelected },
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
                    setTimeout(checkAnimation, 500); // Check every 100ms
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
    }

    async doAttackExecuted(notif: BGA.Notif<"attackExecuted">) {
        Logger.info("Attack executed");
        const attackerId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(notif.args.player_id);
        const results = notif.args.attack_results;
        for (const result in results) {
            const defenderLeaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(Number(result));
            const defenderPanel = this.playerAreas.at(defenderLeaderId).panel;
            const physicalDamage = results[result].physical_damage;
            const magicalDamage = results[result].magical_damage;
            const newHealth = results[result].new_health;
            defenderPanel.receiveAttack(attackerId, newHealth, physicalDamage, magicalDamage);
            await delay(1000);
        }
    }

    async doHealExecuted(notif: BGA.Notif<"healExecuted">) {
        Logger.info("Heal executed");
        const leaderId = notif.args.leader_id;
        const leaderPanel = this.playerAreas.at(leaderId).panel.leaderPanel;
        const newHealth = notif.args.new_health;
        const player_id = notif.args.player_id;
        leaderPanel.health = newHealth;
        document.getElementById(`player_score_${player_id}`).innerText = newHealth.toString();
    }

    async doLeaderEliminated(notif: BGA.Notif<"leaderEliminated">) {
        // Find the player area for the eliminated player
        const leaderId = notif.args.leader_id;
        const player_id = notif.args.player_id;
        const playerArea = this.playerAreas.at(leaderId);
        playerArea.eliminatePlayer();
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