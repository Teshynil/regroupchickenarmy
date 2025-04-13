import { RegroupChickenArmy } from "../regroupchickenarmy";
import { logger } from "./logger";

export function registerExtensions() {

    //@ts-ignore
    dojo.Animation.prototype.playAsync = async function () {
        const animationControl = RegroupChickenArmy.game.board.animationControl;
        logger.debug(`Enqueuing animation ${this}`);
        return animationControl.enqueue(this);
    };

}