import { anim } from "dojo";
import { RegroupChickenArmy } from "../regroupchickenarmy";
import { ListenerElement } from "../utils/listenerElement";
import { GameElement } from "../utils/gameElement";
export class LeaderSelection extends ListenerElement {

    PARENT_ID = "centralArea";
    ELEMENT_ID = "leaderSelectionArea";

    get listeners() {
        return {
            "leaderSelected": { callback: this.doSelect }
        }
    };

    leaders: Leader[] = [new Leader(0), new Leader(1), new Leader(2), new Leader(3)];

    override htmlDefinition: string = `<div id="${this.ELEMENT_ID}"></div>`;

    override afterRender() {
        this.leaders.forEach(leader => {
            leader?.render();
        });
    }

    override beforeDestroy() {
        this.leaders.forEach(leader => {
            leader?.destroy();
        });
    }

    async select(element: HTMLDivElement, leader_id: number, noop: boolean = false) {
        RegroupChickenArmy.game.ajaxcall(`/${RegroupChickenArmy.game.game_name}/${RegroupChickenArmy.game.game_name}/selectLeader.html`, {
            leader_id: leader_id
        }, this, async function () {
            this.leaders.forEach(leader => {
                leader?.disableEvents();
            });
        });

    }

    async doSelect(notif: BGA.Notif<"selectLeader">) {
        const leader_id = notif.args.leader_id;
        const element = this.leaders[leader_id].element;
        const animation = RegroupChickenArmy.game.slideToObject(element, `leaderImg_${leader_id}`, 1000, 600);
        await animation.playAsync();
        element.remove();
        this.leaders[leader_id] = null;
        RegroupChickenArmy.game.playerAreas.at(leader_id).render(true);
        if (RegroupChickenArmy.game.current_player_id == notif.args.player_id) {
            RegroupChickenArmy.game.leader_id = leader_id;
        }
        RegroupChickenArmy.game.board.backgrounds.at(leader_id).isActive = true;
        if (this.leaders.every((e) => e == null)) {
            this.hide();
        }
    }
}

class Leader extends GameElement {
    PARENT_ID = "leaderSelectionArea";
    ELEMENT_ID = `leaderSelection_${this.id}`;


    htmlDefinition: string = `<div id="${this.ELEMENT_ID}" class="leaderImg leader_${this.id}"></div>`;

    override addEventListeners() {
        this.addEventToElement(this.element, "click", () => RegroupChickenArmy.game.leaderSelection.select(this.element, this.id));
    }

}
