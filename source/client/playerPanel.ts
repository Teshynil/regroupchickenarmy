export class PlayerPanel {
    id: number;
    active: boolean;

    constructor(id: number, active: boolean) {
        this.id = id;
        this.active = active;
    }


    render() {
        const board = document.getElementById(`board`);
        if (board == null) throw new Error(`Central Area not found`);
        board.insertAdjacentHTML('beforeend', `
			<div id="playerPanel_${this.id}" class="playerPanel ${!this.active ? "inactive" : ""}">
			</div>
		  `);
        const playerPanel = document.getElementById(`playerPanel_${this.id}`);
        const isRTL = this.id % 2 == 1 ? "rtl" : "";
        playerPanel.insertAdjacentHTML('beforeend', `
			<div id="leaderPanel_${this.id}" class="leaderPanel ${isRTL}">
                <div id="healthMarker_${this.id}" class="healthMarker">
                    30
                </div>
                    <div id="leaderImg_${this.id}" class="leaderImg leader_${this.id} ${!this.active ? "inactive" : ""}">
                </div>
			</div>
		  `);
        playerPanel.insertAdjacentHTML('beforeend', `
			<div id="resourcePanel_${this.id}" class="resourcePanel ${isRTL}">
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
			</div>
		  `);
    }

    enable() {
        document.getElementById(`leaderImg_${this.id}`).classList.remove("inactive");
        document.getElementById(`playerPanel_${this.id}`).classList.remove("inactive");
    }

    disable() {
        document.getElementById(`leaderImg_${this.id}`).classList.add("inactive");
        document.getElementById(`playerPanel_${this.id}`).classList.add("inactive");
    }
}
