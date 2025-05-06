import { RegroupChickenArmy } from "../regroupchickenarmy";
import { Animator } from "../framework/animations/animator";
import { ListenerConfig } from "../framework/core/types";
import { GameElement } from "../framework/elements/gameElement";
import { delay } from "../framework/utils/gameUtils";
import { ListenerElement } from "../framework/elements/listenerElement";
import { Logger } from "../framework/core/logger";
import { CentralArea } from "./centralArea";
import { PlayerArea } from "./playerArea";
import { AttackPhaseContainer } from "./attackDisplay";

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
    attackDisplay: AttackPhaseContainer;

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

        this.attackDisplay = AttackPhaseContainer.createChild(this);
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

    async doFirstPlayerSelected(args: BGA.Notif<"firstPlayerSelected">["args"]): Promise<void> {
        for (const playerArea of this.playerAreas) {
            if (playerArea == null) continue;
            playerArea.panel.leaderPanel.hasPlayerToken = false;
        }
        const leaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(args.player_id);
        this.playerAreas.at(leaderId).panel.leaderPanel.hasPlayerToken = true;
    }

    async doAddInitialsCards(args: BGA.Notif<"addInitialCards">["args"]): Promise<void> {
        const playersCards = args.playersCards;
        const promises = [];
        for (const leaderData of Object.values(playersCards)) {
            const leaderId = leaderData.leader_id;
            const playerArea = this.playerAreas.at(leaderId);
            const grid = playerArea.grid;
            promises.push(grid.addInitialCard(leaderData.card_id));
        }
        await Promise.all(promises);
    }

    startAttackPhase() {
        this.attackDisplay.render();
        this.attackDisplay.banner.element.classList.add("animate");
    }

    async doAttackExecuted(args: BGA.Notif<"attackExecuted">["args"]): Promise<void> {
        const attackerLeaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(args.player_id);

        const attackerNameFormatted = RegroupChickenArmy.game.getFormattedPlayerName(args.player_id);

        const attackerName = RegroupChickenArmy.game.getPlayerName(args.player_id);

        Logger.info(`Attack executed by ${attackerName} (${attackerLeaderId})`);
        const results = args.attack_results;
        const delayTime = Math.min(1800, 5000 / Object.keys(results).length); // 5000ms / number of defenders, capped at 1800ms
        for (const defenderResult of Object.values(results)) {
            const defenderId = defenderResult.defender_id;
            const defenderName = RegroupChickenArmy.game.getFormattedPlayerName(defenderId);
            const defenderLeaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(Number(defenderId));
            Logger.warn(`Defender ${defenderResult.defender_name} (${defenderLeaderId}) received ${defenderResult.total_damage} damage from ${attackerName} (${attackerLeaderId})`);
            const defenderPanel = this.playerAreas.at(defenderLeaderId).panel;
            const physicalDamage = defenderResult.physical_damage;
            const magicalDamage = defenderResult.magical_damage;
            const totalDamage = defenderResult.total_damage;
            const newHealth = defenderResult.new_health;

            if (totalDamage === 0) {
                RegroupChickenArmy.game.statusBar.setTitle(_("${attacker} Attacks ${defender} but inflicts no damage"), { attacker: attackerNameFormatted, defender: defenderName });
                await delay(1000);
            } else {
                RegroupChickenArmy.game.statusBar.setTitle(_("${attacker} Attacks ${defender} doing them ${damage} points of damage"), { attacker: attackerNameFormatted, defender: defenderName, damage: totalDamage });
                await defenderPanel.receiveAttack(attackerLeaderId, newHealth, physicalDamage, magicalDamage, delayTime);
            }
        }
        await delay(500);
    }

    async doHealExecuted(args: BGA.Notif<"healExecuted">["args"]): Promise<void> {
        Logger.info("Heal executed");
        const leaderId = args.leader_id;
        const leaderPanel = this.playerAreas.at(leaderId).panel;
        const oldHealth = leaderPanel.leaderPanel.health;
        const newHealth = args.new_health;
        if (oldHealth === 30) {
            RegroupChickenArmy.game.statusBar.setTitle(_("${player} tried to heal but was already at full health"), { player: args.player_name });
            await delay(600);
        } else {
            RegroupChickenArmy.game.statusBar.setTitle(_("${player} healed ${amount} points"), { player: args.player_name, amount: args.heal_amount });
            await leaderPanel.heal(args.heal_amount, 800);
            await delay(500);
        }
    }

    async doLeaderEliminated(args: BGA.Notif<"leaderEliminated">["args"]): Promise<void> {
        // Find the player area for the eliminated player
        const leaderId = args.leader_id;
        const playerArea = this.playerAreas.at(leaderId);
        playerArea.eliminatePlayer();
    }

    async doUpdateResources(args: BGA.Notif<"resourcesUpdated">["args"]): Promise<void> {
        const leaderId = args.leader_id;
        const resources = args.resources;

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

    HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}" class="playerBackground leader_${this.id} background leaderSprites"></div>`;


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