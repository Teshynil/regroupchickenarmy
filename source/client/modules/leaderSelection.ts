import { anim } from "dojo";
import { RegroupChickenArmy } from "../regroupchickenarmy";
import { ListenerElement } from "../utils/listenerElement";
import { GameElement } from "../utils/gameElement";
import mixinmixer = require("cookbook/mixinmixer");
export class LeaderSelection extends ListenerElement {

    PARENT_ID = "centralArea";
    ELEMENT_ID = "leaderSelectionArea";

    get listeners() {
        return {
            "leaderSelected": { callback: this.doSelect }
        }
    };

    leaders: Leader[] = [new Leader(0), new Leader(1), new Leader(2), new Leader(3)];

    override htmlDefinition: string = `<div id="${this.id}"></div>`;
    override insertPosition: InsertPosition = "beforeend";

    override afterRender() {
        this.leaders.forEach(leader => {
            leader.render();
        });
    }

    select(id: number, noop: boolean = false) {
        this.leaders.forEach((leader => {
            leader.id == id
                ? leader.selectLeader(noop)
                : leader.deselectLeader(noop)
        }));

    }

    doSelect(notif: BGA.Notif<"selectLeader">) {
        if (notif.args.player_id == RegroupChickenArmy.game.player_id) return;
        this.leaders.forEach(leader => {
            leader.render(true);
        });
        this.select(notif.args.leader_id as number, true);
    }
}

class Leader extends GameElement {
    PARENT_ID = "leaderSelectionArea";
    ELEMENT_ID = `leaderSelection_${this.id}`;

    constructor(id: number) {
        super();
        this._id = id;
    }

    htmlDefinition: string = `<div id="${this.ELEMENT_ID}" class="leaderImg leader_${this.id}></div>`;
    insertPosition: InsertPosition = "beforeend";

    override afterRender() {
        if (RegroupChickenArmy.game.isCurrentPlayerActive()) {
            this.addEventListeners();
        }
    }

    addEventListeners() {
        this.element.addEventListener("click", () => RegroupChickenArmy.game.leaderSelection.select(this.id));
    }

    async selectLeader(noop: boolean) {
        this.element.classList.add("selected");
        const animation = RegroupChickenArmy.game.slideToObject(this.element, `leaderImg_${this.id}`, 1000, 600);
        await animation.play();
        this.element.remove();
            RegroupChickenArmy.game.playerAreas.at(this.id).enable();
            if (!noop) {
                setTimeout(() => {
                    RegroupChickenArmy.game.ajaxcall(`/${RegroupChickenArmy.game.game_name}/${RegroupChickenArmy.game.game_name}/selectLeader.html`, {
                        leader_id: this.id
                    }, this, function () { });
                }, 1000);
            }
    }

    deselectLeader(noop: boolean) {
        if (noop) return;
        this.element.classList.remove("selected");
        this.element.classList.add("not_selected");
    }
}
