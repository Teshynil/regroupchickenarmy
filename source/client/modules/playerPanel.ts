import { GameElement } from "../utils/gameElement";

export class PlayerPanel extends GameElement {
    PARENT_ID = `board`;
    ELEMENT_ID = `playerPanel_${this.id}`;
    htmlDefinition: string = `<div id="playerPanel_${this.id}" class="playerPanel"></div>`;

    leaderPanel: LeaderPanel;
    resourcePanel: ResourcePanel;

    public override afterConstructor(): void {
        this.leaderPanel = new LeaderPanel(this.id);
        this.resourcePanel = new ResourcePanel(this.id);
    }

    override afterRender() {
        this.leaderPanel.render();
        this.resourcePanel.render();
    }
}

class LeaderPanel extends GameElement {
    PARENT_ID = `playerPanel_${this.id}`;
    ELEMENT_ID = `leaderPanel_${this.id}`;

    get isRTL() { return this.id % 2 == 1 ? "rtl" : "" };

    htmlDefinition: string = `<div id="${this.ELEMENT_ID}" class="leaderPanel ${this.isRTL}">
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
}

class ResourcePanel extends GameElement {
    PARENT_ID = `playerPanel_${this.id}`;
    ELEMENT_ID = `resourcePanel_${this.id}`;
    get isRTL() { return this.id % 2 == 1 ? "rtl" : "" };

    htmlDefinition = `<div id="${this.ELEMENT_ID}" class="resourcePanel ${this.isRTL}">
                <div class="resource Defense_Physic" id="resourceContainer_${this.id}">
                    <span id="defPhy_${this.id}" class="resourceCounter">3</span>
                </div>
                <div class="resource Attack_Physic" id="resourceContainer_${this.id}">
                    <span id="atkPhy_${this.id}" class="resourceCounter">5</span>
                </div>
                <div class="resource Defense_Magic" id="resourceContainer_${this.id}">
                    <span id="defMag_${this.id}" class="resourceCounter">7</span>
                </div>
                <div class="resource Attack_Magic" id="resourceContainer_${this.id}">
                    <span id="atkMag_${this.id}" class="resourceCounter">9</span>
                </div>
                <div class="resource Potion" id="resourceContainer_${this.id}">
                    <span id="potion_${this.id}" class="resourceCounter">7</span>
                </div>
                <div class="resource Coin" id="resourceContainer_${this.id}">
                    <span id="coins_${this.id}" class="resourceCounter">5</span>
                </div>
			</div>`;
            
            get shieldElement(){ return document.getElementById(`defPhy_${this.id}`)};
            get fighterElement(){ return document.getElementById(`atkPhy_${this.id}`)};
            get barrierElement(){ return document.getElementById(`defMag_${this.id}`)};
            get wizardElement(){ return document.getElementById(`atkMag_${this.id}`)};
            get potionElement(){ return document.getElementById(`potion_${this.id}`)};
            get coinElement(){ return document.getElementById(`coins_${this.id}`)};

}