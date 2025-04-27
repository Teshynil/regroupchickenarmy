import { GameElement } from "../utils/gameElement";
import { ListenerElement } from "../utils/listenerElement";
import { ListenerConfig } from "../utils/definitions";
import { RegroupChickenArmy } from "../regroupchickenarmy";
import { Animator } from "../utils/animations/animator";

export class PlayerPanel extends GameElement {
    PARENT_ID = `board`;
    ELEMENT_ID = `playerPanel_${this.id}`;
    HTML_DEFINITION: string = `<div id="playerPanel_${this.id}" class="playerPanel"></div>`;

    leaderPanel: LeaderPanel;
    resourcePanel: ResourcePanel;

    public override afterConstructor(): void {
        this.leaderPanel = LeaderPanel.createChild(this, this.id);
        this.resourcePanel = ResourcePanel.createChild(this, this.id);
    }

    public async receiveAttack(from: number, newHealth: number, physicalDamage: number, magicalDamage: number, animationTime: number) {
        const damageAnimationTime = animationTime / 2;
        const health = this.leaderPanel.health;
        this.element.style.setProperty("--element-animation-time", `${damageAnimationTime}ms`);
        const physicalDamageAnimation = Animator.slideTemporaryObject
            .id(`physical_DamageAnimation_${from}_to_${this.id}`)
            .definition(`<div id="physical_DamageAnimation_${from}_to_${this.id}" class="physical damageText">-${physicalDamage}</div>`)
            .parent(this.element.id)
            .from(`healthMarker_${this.id}`)
            .target(`healthMarker_${this.id}`)
            .duration(damageAnimationTime)
            .beforeStart((element) => {
                element.classList.add("damageAnimation");
            })
            .delay(0)
            .build();
        const magicalDamageAnimation = Animator.slideTemporaryObject
            .id(`magical_DamageAnimation_${from}_to_${this.id}`)
            .definition(`<div id="magical_DamageAnimation_${from}_to_${this.id}" class="magical damageText">-${magicalDamage}</div>`)
            .parent(this.element.id)
            .from(`healthMarker_${this.id}`)
            .target(`healthMarker_${this.id}`)
            .duration(damageAnimationTime)
            .beforeStart((element) => {
                element.classList.add("damageAnimation");
            })
            .delay(0)
            .build();
        await Animator.play(physicalDamageAnimation);
        this.leaderPanel.health = health - physicalDamage;
        await Animator.play(magicalDamageAnimation);
        this.leaderPanel.health = newHealth;
        this.element.style.removeProperty("--element-animation-time");
    }

    public async heal(healAmount: number, animationTime: number) {
        const health = this.leaderPanel.health;
        this.element.style.setProperty("--element-animation-time", `${animationTime}ms`);
        const healAnimation = Animator.slideTemporaryObject
            .id(`healAnimation_${this.id}`)
            .definition(`<div id="healAnimation_${this.id}" class="heal damageText">+${healAmount}</div>`)
            .parent(this.element.id)
            .from(`healthMarker_${this.id}`)
            .target(`healthMarker_${this.id}`)
            .duration(animationTime)
            .beforeStart((element) => {
                element.classList.add("healAnimation");
            })
            .delay(0)
            .build();
        await Animator.play(healAnimation);
        this.leaderPanel.health = health + healAmount;
        this.element.style.removeProperty("--element-animation-time");
    }
}

class LeaderPanel extends GameElement {
    PARENT_ID = `playerPanel_${this.id}`;
    ELEMENT_ID = `leaderPanel_${this.id}`;

    get isRTL() { return this.id % 2 == 1 ? "rtl" : "" };

    HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}" class="leaderPanel ${this.isRTL}">
                <div id="healthMarker_${this.id}" class="healthMarker">30</div>
                    <div id="leaderImg_${this.id}" class="leaderImg leader_${this.id}">
                </div>
			</div>`;
    get healthElement() {
        return document.getElementById(`healthMarker_${this.id}`);
    }

    get leaderElement() {
        return document.getElementById(`leaderImg_${this.id}`);
    }

    get health(): number {
        return Number(this.healthElement.innerText);
    }

    set health(val: number) {
        this.healthElement.innerText = val.toString();
    }

    set hasPlayerToken(val: boolean) {
        if (val) {
            this.leaderElement.classList.add("hasPlayerToken");
        } else {
            this.leaderElement.classList.remove("hasPlayerToken");
        }
    }
}

class ResourcePanel extends GameElement {
    PARENT_ID = `playerPanel_${this.id}`;
    ELEMENT_ID = `resourcePanel_${this.id}`;
    get isRTL() { return this.id % 2 == 1 ? "rtl" : "" };

    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}" class="resourcePanel ${this.isRTL}">
                <div class="resource Defense_Physic" id="resourceContainer_${this.id}">
                    <span id="defPhy_${this.id}" class="resourceCounter">0</span>
                </div>
                <div class="resource Attack_Physic" id="resourceContainer_${this.id}">
                    <span id="atkPhy_${this.id}" class="resourceCounter">0</span>
                </div>
                <div class="resource Defense_Magic" id="resourceContainer_${this.id}">
                    <span id="defMag_${this.id}" class="resourceCounter">0</span>
                </div>
                <div class="resource Attack_Magic" id="resourceContainer_${this.id}">
                    <span id="atkMag_${this.id}" class="resourceCounter">0</span>
                </div>
                <div class="resource Potion" id="resourceContainer_${this.id}">
                    <span id="potion_${this.id}" class="resourceCounter">0</span>
                </div>
                <div class="resource Coin" id="resourceContainer_${this.id}">
                    <span id="coins_${this.id}" class="resourceCounter">0</span>
                </div>
                <div class="player-name" id="playerName_${this.id}"></div>
			</div>`;

    set playerName(val: string) {
        document.getElementById(`playerName_${this.id}`).innerText = val;
    }

    get shieldElement() { return document.getElementById(`defPhy_${this.id}`) };
    get fighterElement() { return document.getElementById(`atkPhy_${this.id}`) };
    get barrierElement() { return document.getElementById(`defMag_${this.id}`) };
    get wizardElement() { return document.getElementById(`atkMag_${this.id}`) };
    get potionElement() { return document.getElementById(`potion_${this.id}`) };
    get coinElement() { return document.getElementById(`coins_${this.id}`) };

    get shieldCount(): number { return Number(this.shieldElement.innerText) };
    get fighterCount(): number { return Number(this.fighterElement.innerText) };
    get barrierCount(): number { return Number(this.barrierElement.innerText) };
    get wizardCount(): number { return Number(this.wizardElement.innerText) };
    get potionCount(): number { return Number(this.potionElement.innerText) };
    get coinCount(): number { return Number(this.coinElement.innerText) };
}
