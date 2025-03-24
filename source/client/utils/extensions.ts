import { RegroupChickenArmy } from "../regroupchickenarmy";

export function registerExtensions() {

    //@ts-ignore
    dojo.Animation.prototype.playAsync = async function () {
        const animationControl = RegroupChickenArmy.game.board.animationControl;
        return animationControl.enqueue(this);
    };  

}