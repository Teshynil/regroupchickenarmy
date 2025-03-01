import { anim } from "dojo";
import { RegroupChickenArmy } from "./regroupchickenarmy";
export class LeaderSelection {

    element: HTMLDivElement;
    leaders: Leader[] = [new Leader(0), new Leader(1), new Leader(2), new Leader(3)];

    render() {
        const centralArea = document.getElementById(`centralArea`);
        if (centralArea == null) throw new Error(`Central Area not found`);
        centralArea.insertAdjacentHTML('beforeend', `
			<div id="leaderSelectionArea">
			</div>
		  `);
        this.element = document.getElementById("leaderSelectionArea") as HTMLDivElement;
        this.leaders.forEach(leader => {
            leader.render();
        });
    }

    select(id: number) {
        this.leaders.forEach((leader => {
            leader.id == id
                ? leader.selectLeader()
                : leader.deselectLeader()
        }));
    }

    hide() {
        this.element.style.display = "none";
    }
    show() {
        this.element.style.display = null;
    }
}

class Leader {
    id: number;
    element: HTMLDivElement;
    constructor(id: number) {
        this.id = id;
    }

    render() {
        const leaderSelectionArea = document.getElementById(`leaderSelectionArea`);
        if (leaderSelectionArea == null) throw new Error(`LeaderSelectionArea not found`);
        leaderSelectionArea.insertAdjacentHTML('beforeend',
            `<div id="leaderSelection_${this.id}" class="leaderImg leader_${this.id}"></div>`);
        this.element = document.getElementById(`leaderSelection_${this.id}`) as HTMLDivElement;

        if (RegroupChickenArmy.game.isCurrentPlayerActive()) {
            this.addEventListeners();
        }
    }

    addEventListeners() {
        this.element.addEventListener("click", () => RegroupChickenArmy.game.leaderSelection.select(this.id));
    }

    selectLeader() {
        this.element.classList.add("selected");
        const animation = RegroupChickenArmy.game.slideToObject(this.element, `leaderImg_${this.id}`, 1000, 600);
        animation.on("End", () => {
            this.element.remove();
            RegroupChickenArmy.game.playerAreas.at(this.id).enable();
            setTimeout(() => {
                RegroupChickenArmy.game.ajaxcall(`/${RegroupChickenArmy.game.game_name}/${RegroupChickenArmy.game.game_name}/selectLeader.html`, {
                    leader_id: this.id, lock: true, 
                }, this, function () { });
            }, 1000);
        });
        animation.play();
    }

    deselectLeader() {
        this.element.classList.remove("selected");
        this.element.classList.add("not_selected");
    }
}
