import { RegroupChickenArmy } from '../regroupchickenarmy';
import { Animator } from '../framework/animations/animator';
import { ListenerConfig } from '../framework/types';
import { GameElement } from '../framework/elements/gameElement';
import { delay, waitUntil } from '../framework/utils/gameUtils';
import { ListenerElement } from '../framework/elements/listenerElement';
import { Logger } from '../framework/core/logger';
import { CentralArea } from './centralArea';
import { PlayerArea } from './playerArea';
import { AttackPhaseContainer } from './attackDisplay';
import { createElement } from '../framework/utils/dom';

export class Board extends ListenerElement {
    PARENT_ID = `game_play_area`;
    ELEMENT_ID = `board`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}"></div>`;

    get listeners(): ListenerConfig {
        return {
            boardsInitialized: { callback: this.doBoardsInitialized },
            firstPlayerSelected: { callback: this.doFirstPlayerSelected },
            addInitialCards: { callback: this.doAddInitialsCards },
            attackExecuted: { callback: this.doAttackExecuted },
            resourcesUpdated: { callback: this.doUpdateResources },
            healExecuted: { callback: this.doHealExecuted },
            leaderEliminated: { callback: this.doLeaderEliminated },
            gameWinner: { callback: this.doGameWinner },
        };
    }

    backgrounds: PlayerBackground[] = [];
    centralArea: CentralArea;
    playerAreas: PlayerArea[] = [];
    attackDisplay: AttackPhaseContainer;

    skipAnimations = false;

    constructor() {
        super();

        // Initialize child components with this as parent
        this.backgrounds = [
            PlayerBackground.createChild(this, 0),
            PlayerBackground.createChild(this, 1),
            PlayerBackground.createChild(this, 2),
            PlayerBackground.createChild(this, 3),
        ];

        this.centralArea = CentralArea.createChild(this);

        this.playerAreas = [
            PlayerArea.createChild(this, 0),
            PlayerArea.createChild(this, 1),
            PlayerArea.createChild(this, 2),
            PlayerArea.createChild(this, 3),
        ];

        this.attackDisplay = AttackPhaseContainer.createChild(this);
    }

    public override afterRenderAll(_force: boolean): void {
        // Children are automatically rendered by the parent class

        // Hide player areas initially
        this.playerAreas.forEach((playerArea) => {
            playerArea.hide();
        });
    }

    set isActive(val: boolean) {
        if (val) {
            this.element.classList.add('activePlayer');
        } else {
            this.element.classList.remove('activePlayer');
        }
    }

    get isActive(): boolean {
        return this.element.classList.contains('activePlayer');
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

    private async doBoardsInitialized(args: BGA.Notif<'boardsInitialized'>['args']): Promise<void> {
        Logger.info('Entering Notification Boards initialized');
        this.centralArea.leaderSelection.destroy();
        this.centralArea.marketArea.show();
        // Process initial cards
        const playerCards = args.playersCards;
        for (const playerArea of this.playerAreas) {
            if (playerArea == null) continue;
            const playerAreaId = playerArea.id;
            if (playerCards[playerAreaId] == null) {
                playerArea.destroy();
                this.playerAreas[playerAreaId] = null;
            }
        }

        for (const playerArea in args.playersCards) {
            this.playerAreas.at(Number(playerArea)).grid.render();
        }

        await this.doAddInitialsCards(args);

        // Process initial resources
        const playerResources = args.playersResources;
        for (const leaderId in playerResources) {
            const playerArea = this.playerAreas.at(parseInt(leaderId));
            if (playerArea) {
                const resourceData = playerResources[leaderId];
                this.doUpdateResources({
                    player_id: resourceData.player_id,
                    leader_id: parseInt(leaderId),
                    resources: resourceData.resources,
                } as unknown as BGA.Notif<'resourcesUpdated'>['args']);
            }
        }
    }

    async doFirstPlayerSelected(args: BGA.Notif<'firstPlayerSelected'>['args']): Promise<void> {
        for (const playerArea of this.playerAreas) {
            if (playerArea == null) continue;
            playerArea.panel.leaderPanel.hasPlayerToken = false;
        }
        const leaderId = RegroupChickenArmy.game.getLeaderIdFromPlayerId(args.player_id);
        this.playerAreas.at(leaderId).panel.leaderPanel.hasPlayerToken = true;
    }

    async doAddInitialsCards(args: BGA.Notif<'addInitialCards'>['args']): Promise<void> {
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
        if (RegroupChickenArmy.game.getGameUserPreference(150) == 1) {
            Animator.instance.fastforwardAnimations = true;
        }
        this.attackDisplay.render();
        this.attackDisplay.show();
        this.attackDisplay.banner.element.classList.add('animate');
        this.attackDisplay.element.classList.add('animate');
    }

    async stopAttackPhase() {
        if (this.attackDisplay.isRendered()) {
            this.attackDisplay.banner.element.classList.remove('animate');
            this.attackDisplay.element.classList.remove('animate');
            await delay(1000);
            this.attackDisplay.hide();
        }
        Animator.instance.fastforwardAnimations = false;
    }

    async doAttackExecuted(args: BGA.Notif<'attackExecuted'>['args']): Promise<void> {
        const result = await waitUntil(() => this.attackDisplay.isRendered(), 3000);
        if (!result) {
            Logger.error('Attack display was not rendered in time, this was not expected');
        }
        await delay(1000);

        const noDamage = args.magical_attack + args.physical_attack == 0;
        if (noDamage) {
            RegroupChickenArmy.game.statusBar.setTitle(_('${attacker} Has no armies to attack with'), {
                attacker: args.player_name,
            });
            await delay(1000);
            return;
        }

        RegroupChickenArmy.game.statusBar.setTitle(_('${attacker} Armies Attack!'), { attacker: args.player_name });

        if (args.physical_attack != 0) {
            this.attackDisplay.initializeAttack(args);
            this.attackDisplay.initializePhysicalDamage(args);
            await this.attackDisplay.runAttackAnimation(args);
            for (const defender of Object.values(args.attack_results)) {
                const defenderId = defender.leader_id;
                const defenderPanel = this.playerAreas.at(defenderId).panel;
                defenderPanel.leaderPanel.health -= defender.physical_damage;
            }
            await this.attackDisplay.hideDamageAnimation();
            await delay(800);
            this.attackDisplay.finishDamageDisplay();
        }

        if (args.magical_attack != 0) {
            this.attackDisplay.initializeAttack(args);
            this.attackDisplay.initializeMagicalDamage(args);
            await this.attackDisplay.runAttackAnimation(args);
            for (const defender of Object.values(args.attack_results)) {
                const defenderId = defender.leader_id;
                const defenderPanel = this.playerAreas.at(defenderId).panel;
                defenderPanel.leaderPanel.health -= defender.magical_damage;
            }
            await this.attackDisplay.hideDamageAnimation();
            await delay(800);
            this.attackDisplay.finishDamageDisplay();
        }
    }

    async doHealExecuted(args: BGA.Notif<'healExecuted'>['args']): Promise<void> {
        const leaderId = args.leader_id;
        const leaderPanel = this.playerAreas.at(leaderId).panel.leaderPanel;
        const oldHealth = leaderPanel.health;
        const newHealth = args.new_health;
        if (oldHealth === 30) {
            RegroupChickenArmy.game.statusBar.setTitle(_('${player} tried to heal but was already at full health'), {
                player: args.player_name,
            });
            await delay(500);
            return;
        }

        this.attackDisplay.initializeHealing(args);
        RegroupChickenArmy.game.statusBar.setTitle(_('${player} is healing!'), { player: args.player_name });

        await this.attackDisplay.runHealAnimation(args);
        leaderPanel.health = Math.min(30, newHealth);
        await this.attackDisplay.hideDamageAnimation();
        await delay(500);
        this.attackDisplay.finishDamageDisplay();
    }

    async doLeaderEliminated(args: BGA.Notif<'leaderEliminated'>['args']): Promise<void> {
        // Find the player area for the eliminated player
        const leaderId = args.leader_id;
        const playerArea = this.playerAreas.at(leaderId);
        playerArea.eliminatePlayer();
    }

    async doUpdateResources(args: BGA.Notif<'resourcesUpdated'>['args']): Promise<void> {
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

    async doGameWinner(args: BGA.Notif<'gameWinner'>['args']): Promise<void> {
        const leaderId = args.leader_id;
        const playerArea = this.playerAreas.at(leaderId);
        const backdrop = createElement(`<div id="winnerBackdrop" class="backdrop">
            <div id="winnerText">The Winner is:</div>
            <div id="winnerImg">
                <div id="winnerImgHolder" class="sprite leaderSprites leader_${leaderId} noBack"></div>
            </div>
            <div id="winnerName">${args.player_name}</div>
            </div>`);
        this.element.appendChild(backdrop);
        const animation = Animator.cssAnimation
            .element(backdrop)
            .shouldEnqueue(false)
            .animationClass('animate', 'fadeIn')
            .duration(2000)
            .build();
        const animation2 = Animator.slideTemporaryObject
            .definition(`<div id="tempWinnerImg" class="sprite leaderSprites leader_${leaderId} noBack"></div>`)
            .parent(this.element.id)
            .from(playerArea.panel.leaderPanel.leaderElement.id)
            .target('winnerImgHolder')
            .shouldEnqueue(false)
            .beforeStart((element) => {
                element.style.setProperty('--animation-duration', `${2800}ms`);
                element.style.width = 'calc(4*var(--card-size))';
                element.style.height = 'calc(4*var(--card-size))';
            })
            .afterEnd((_element) => {
                document.getElementById('winnerImgHolder').style.opacity = '1';
                document.getElementById('winnerName').style.opacity = '1';
                document.getElementById('winnerText').style.opacity = '1';
            })
            .duration(3000)
            .build();
        Animator.play(animation);
        Animator.play(animation2);
        await delay(3000);
        await delay(3000);
        backdrop.classList.remove('animate', 'fadeIn');
        const outAnimation = Animator.cssAnimation
            .element(backdrop)
            .shouldEnqueue(false)
            .animationClass('animate', 'fadeOut')
            .duration(2000)
            .build();
        await Animator.play(outAnimation);
    }
}

class PlayerBackground extends GameElement {
    PARENT_ID = 'board';
    ELEMENT_ID = `playerBackground_${this.id}`;

    HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}" class="playerBackground leader_${this.id} sprite leaderSprites background"></div>`;

    public override afterRenderThis(_force: boolean): void {
        this.isActive = false;
    }

    set isActive(val: boolean) {
        if (!val) {
            this.element.classList.add('inactive');
        } else {
            this.element.classList.remove('inactive');
        }
    }
}
