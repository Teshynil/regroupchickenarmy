import { GameElement } from "../framework/elements/gameElement";

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

        this.damageContainers[attackData.leader_id] = DamageContainer.createChild(this);
        this.damageContainers[attackData.leader_id].render()
            .hide();

        for (const defender of defenders) {
            this.damageContainers[defender.leader_id] = DamageContainer.createChild(this);
            this.damageContainers[defender.leader_id].render()
                .hide();
        }
    }

    initializePhysicalDamage(attackData: BGA.Notif<"attackExecuted">["args"]) {
        const defenders = Object.values(attackData.attack_results);

        this.damageContainers[attackData.leader_id]
            .type("Fighter")
            .damageText.damage(attackData.physical_attack);

        for (const defender of defenders) {
            if (defender.physical_damage === 0) {
                this.damageContainers[defender.leader_id].damageText.destroy();
                this.damageContainers[defender.leader_id].type("Shield");
                continue;
            }
            this.damageContainers[defender.leader_id]
                .damageText.type("physical")
                .damage(defender.physical_damage);
        }
    }

    initializeMagicalDamage(attackData: BGA.Notif<"attackExecuted">["args"]) {
        const defenders = Object.values(attackData.attack_results);

        this.damageContainers[attackData.leader_id]
            .type("Wizard")
            .damageText.damage(attackData.magical_attack);

        for (const defender of defenders) {
            if (defender.magical_damage === 0) {
                this.damageContainers[defender.leader_id].damageText.destroy();
                this.damageContainers[defender.leader_id].type("Barrier");
                continue;
            }
            this.damageContainers[defender.leader_id].damageText
                .type("magical")
                .damage(defender.magical_damage);
        }
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
        this.damageText = DamageText.createChild(this);
    }

    type(val: "Fighter" | "Wizard" | "Shield" | "Barrier" | null): this {
        this.element.classList.remove("Fighter", "Wizard", "Shield", "Barrier", "resource");
        if (!val) return this;
        this.element.classList.add("resource");
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