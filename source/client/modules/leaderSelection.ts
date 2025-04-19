import { RegroupChickenArmy } from "../regroupchickenarmy";
import { ListenerElement } from "../utils/listenerElement";
import { ListenerConfig } from "../utils/definitions";
import { GameElement } from "../utils/gameElement";
import { Animator } from "../utils/animations/animator";

export class LeaderSelection extends ListenerElement {

    PARENT_ID = "centralArea";
    ELEMENT_ID = "leaderSelectionArea";

    get listeners(): ListenerConfig {
        return {
            "leaderSelected": { callback: this.doSelect }
        }
    };

    // Use the static create method to create leaders with parent-child relationship
    leaders: Leader[] = [
        Leader.createChild(this, 0),
        Leader.createChild(this, 1),
        Leader.createChild(this, 2),
        Leader.createChild(this, 3)
    ];

    override HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}"></div>`;

    // No need to manually render or destroy leaders as they are now children
    // and will be automatically rendered/destroyed with the parent

    async select(_element: HTMLDivElement, leader_id: number, _noop: boolean = false) {
        RegroupChickenArmy.game.ajaxcall(`/${RegroupChickenArmy.game.game_name}/${RegroupChickenArmy.game.game_name}/selectLeader.html`, {
            leader_id: leader_id
        }, this, async function () {
            this.leaders.forEach(leader => {
                leader?.disableEvents();
            });
        });

    }

    async doSelect(notif: BGA.Notif<"leaderSelected">) {
        const leader_id = notif.args.leader_id;
        const element = this.leaders[leader_id].element;
        RegroupChickenArmy.game.leaders_id[notif.args.player_id] = Number(leader_id);
        const animation = Animator.slideToObject
            .id(`MoveLeaderToStartPosition_${leader_id}`)
            .element(element)
            .target(`leaderImg_${leader_id}`)
            .duration(800)
            .delay(0)
            .build();
        await Animator.play(animation);
        element.remove();
        this.leaders[leader_id] = null;
        RegroupChickenArmy.game.playerAreas.at(leader_id).render(true);
        RegroupChickenArmy.game.board.backgrounds.at(leader_id).isActive = true;
        if (this.leaders.every((e) => e == null)) {
            this.hide();
        }
    }
}

class Leader extends GameElement {
    PARENT_ID = "leaderSelectionArea";
    ELEMENT_ID = `leaderSelection_${this.id}`;


    HTML_DEFINITION: string = `<div id="${this.ELEMENT_ID}" class="leaderImg leader_${this.id}"></div>`;

    override addEventListeners() {
        this.addEventToElement(this.element, "click", () => RegroupChickenArmy.game.board.centralArea.leaderSelection.select(this.element, this.id));
    }

}
