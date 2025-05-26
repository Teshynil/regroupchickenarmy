import { GameElement } from "../framework/elements/gameElement";
import { RegroupChickenArmy } from "../regroupchickenarmy";

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
}

class LeaderPanel extends GameElement {
    PARENT_ID = `playerPanel_${this.id}`;
    ELEMENT_ID = `leaderPanel_${this.id}`;

    get isRTL() { return this.id % 2 == 1 ? "rtl" : "" };

    HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}" class="leaderPanel ${this.isRTL}">
                <div id="healthMarker_${this.id}" class="healthMarker"></div>
                    <div id="leaderImg_${this.id}" class="leaderImg sprite leaderSprites leader_${this.id}">
                    <div id="playerTokenHolder_${this.id}" class="sprite gui playerToken"></div>
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
        const player_id = RegroupChickenArmy.game.getPlayerIdFromLeaderId(this.id);
        document.getElementById(`player_score_${player_id}`).innerText = val.toString();
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
                <div class="resource Defense_Physic sprite gui shieldTile" id="resourceContainer_${this.id}">
                    <span id="defPhy_${this.id}" class="resourceCounter"></span>
                </div>
                <div class="resource Attack_Physic sprite gui fighterTile" id="resourceContainer_${this.id}">
                    <span id="atkPhy_${this.id}" class="resourceCounter"></span>
                </div>
                <div class="resource Defense_Magic sprite gui barrierTile" id="resourceContainer_${this.id}">
                    <span id="defMag_${this.id}" class="resourceCounter"></span>
                </div>
                <div class="resource Attack_Magic sprite gui wizardTile" id="resourceContainer_${this.id}">
                    <span id="atkMag_${this.id}" class="resourceCounter"></span>
                </div>
                <div class="resource Potion sprite gui potionTile" id="resourceContainer_${this.id}">
                    <span id="potion_${this.id}" class="resourceCounter"></span>
                </div>
                <div class="resource Coin sprite gui coinTile" id="resourceContainer_${this.id}">
                    <span id="coins_${this.id}" class="resourceCounter"></span>
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
