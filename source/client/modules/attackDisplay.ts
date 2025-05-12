import { Animator } from "../framework/animations/animator";
import { GameElement } from "../framework/elements/gameElement";
import { delay } from "../framework/utils/gameUtils";
import { RegroupChickenArmy } from "../regroupchickenarmy";

export class AttackPhaseContainer extends GameElement {
    PARENT_ID = `board`;
    ELEMENT_ID = `attackPhaseContainer`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}"></div>`;

    banner: AttackPhaseBanner;

    damageContainers: DamageContainer[] = [];

    override get renderWithParent() { return false };

    override afterConstructor() {
        this.banner = AttackPhaseBanner.createChild(this);
    }

    initializeAttack(attackData: BGA.Notif<"attackExecuted">["args"]) {

        const defenders = Object.values(attackData.attack_results);

        this.damageContainers[attackData.leader_id] = DamageContainer.createChild(this, attackData.leader_id);
        this.damageContainers[attackData.leader_id].render()
            .hide();

        for (const defender of defenders) {
            this.damageContainers[defender.leader_id] = DamageContainer.createChild(this, defender.leader_id);
            this.damageContainers[defender.leader_id].render()
                .hide();
        }
    }

    finishDamageDisplay() {
        for (const damageContainer of this.damageContainers) {
            damageContainer?.destroy();
        }
        this.damageContainers = [];
    }

    initializePhysicalDamage(attackData: BGA.Notif<"attackExecuted">["args"]) {
        const defenders = Object.values(attackData.attack_results);

        this.damageContainers[attackData.leader_id]
            .type("fighter")
            .damageText.damage(attackData.physical_attack)
            .type("physical");

        for (const defender of defenders) {
            if (defender.physical_damage === 0) {
                this.damageContainers[defender.leader_id].damageText.destroy();
                this.damageContainers[defender.leader_id].type("shield");
                continue;
            }
            this.damageContainers[defender.leader_id]
                .damageText.type("physical")
                .damage(-defender.physical_damage);
        }
    }

    initializeMagicalDamage(attackData: BGA.Notif<"attackExecuted">["args"]) {
        const defenders = Object.values(attackData.attack_results);

        this.damageContainers[attackData.leader_id]
            .type("wizard")
            .damageText.damage(attackData.magical_attack)
            .type("magical");

        for (const defender of defenders) {
            if (defender.magical_damage === 0) {
                this.damageContainers[defender.leader_id].damageText.destroy();
                this.damageContainers[defender.leader_id].type("barrier");
                continue;
            }
            this.damageContainers[defender.leader_id].damageText
                .type("magical")
                .damage(-defender.magical_damage);
        }
    }

    initializeHealing(healData: BGA.Notif<"healExecuted">["args"]) {
        this.damageContainers[healData.leader_id] = DamageContainer.createChild(this, healData.leader_id);
        this.damageContainers[healData.leader_id].render()
            .hide();
        this.damageContainers[healData.leader_id]
            .type("potion")
            .damageText.damage(healData.heal_amount)
            .type("heal");
    }

    async runAttackAnimation(attackData: BGA.Notif<"attackExecuted">["args"]) {
        const attackerId = attackData.leader_id;
        // Show first the attacker damage output
        RegroupChickenArmy.game.placeOnObject(this.damageContainers[attackerId].element, `leaderPanel_${attackerId}`);
        this.damageContainers[attackerId].show();
        const animation = Animator.cssAnimation
            .element(this.damageContainers[attackerId].element)
            .animationClass("animate")
            .duration(1000)
            .build();
        await Animator.play(animation);

        await delay(1000);

        const defenders = Object.values(attackData.attack_results);
        const duration = 1000;
        for (const defender of defenders) {
            const damageContainer = this.damageContainers[defender.leader_id];
            RegroupChickenArmy.game.placeOnObject(damageContainer.element, `leaderPanel_${defender.leader_id}`);
            damageContainer.show();
            const animation = Animator.cssAnimation
                .element(damageContainer.element)
                .animationClass("animate")
                .duration(duration)
                .shouldEnqueue(false)
                .build();
            Animator.play(animation);
            if (damageContainer.damageText.isRendered()) {
                damageContainer.damageText.show();
            }
        }
        await delay(duration);
    }

    async runHealAnimation(healData: BGA.Notif<"healExecuted">["args"]) {
        const leaderId = healData.leader_id;
        RegroupChickenArmy.game.placeOnObject(this.damageContainers[leaderId].element, `leaderPanel_${leaderId}`);
        this.damageContainers[leaderId].show();
        const animation = Animator.cssAnimation
            .element(this.damageContainers[leaderId].element)
            .animationClass("animate")
            .duration(1000)
            .build();
        await Animator.play(animation);
        await delay(500);
    }


    async hideDamageAnimation() {
        for (const damageContainer of this.damageContainers) {
            damageContainer?.hide();
        }
        await delay(1000);
        for (const damageContainer of this.damageContainers) {
            damageContainer?.element.classList.remove("animate");
        }
    }

    public override afterHide(): void {
        this.banner.hide();
    }

    public override afterShow(): void {
        this.banner.show();
    }
}


class AttackPhaseBanner extends GameElement {
    PARENT_ID = `board`;
    ELEMENT_ID = `attackPhaseBanner`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}"></div>`;
}

class DamageContainer extends GameElement {
    PARENT_ID = `attackPhaseContainer`;
    ELEMENT_ID = `damageContainer_${this.id}`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}" class="damageContainer"></div>`;

    damageText: DamageText;
    override afterConstructor() {
        this.damageText = DamageText.createChild(this, this.id);
    }

    type(val: "fighter" | "wizard" | "shield" | "barrier" | "potion" | null): this {
        this.element.classList.remove("fighter", "wizard", "shield", "barrier", "potion", "resource", "sprite-b", "gui");
        if (!val) return this;
        this.element.classList.add("sprite-b", "gui", "resource");
        this.element.classList.add(val);
        return this;
    }
}

class DamageText extends GameElement {
    PARENT_ID = `damageContainer_${this.id}`;
    ELEMENT_ID = `damageText_${this.id}`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}" class="damageText"></div>`;

    damage(val: number): this {
        this.element.innerText = val.toString();
        return this;
    }

    type(val: "physical" | "magical" | "heal"): this {
        this.element.classList.remove("physical", "magical", "heal");
        this.element.classList.add(val);
        return this;
    }
}