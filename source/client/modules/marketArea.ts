import { RegroupChickenArmy } from "../regroupchickenarmy";
import { ListenerElement } from "../utils/listenerElement";
import { Cards, CardElement } from "./cards";

export class MarketArea extends ListenerElement {

    PARENT_ID = "centralArea";
    ELEMENT_ID = "market";

    get listeners() {
        return {
            "marketUpdate": { callback: this.doUpdateMarket }
        }
    };

    override htmlDefinition: string = `
    <div id="${this.ELEMENT_ID}">
        <div id="deck" class="deck card"></div>
        <div id="market_card_0" class="card" data-card-id="0"></div>
        <div id="market_card_1" class="card" data-card-id="0"></div>
        <div id="market_card_2" class="card" data-card-id="0"></div>
        <div id="market_cost_0"></div>
        <div id="market_cost_1"></div>
    </div>`;

    deck: HTMLDivElement;
    cards: HTMLDivElement[] = [null, null, null];

    override afterRender() {
        this.cards[0] = document.getElementById("market_card_0") as HTMLDivElement;
        this.cards[1] = document.getElementById("market_card_1") as HTMLDivElement;
        this.cards[2] = document.getElementById("market_card_2") as HTMLDivElement;
        this.deck = document.getElementById("deck") as HTMLDivElement;
    }

    doUpdateMarket(notif: BGA.Notif<"marketUpdate">) {
        for (let key in notif.args.cards) {
            const card = notif.args.cards[key];
            this.cards[key].dataset["cardId"] = `${card.card_id}`;
        }
    }

    private preSelectCard(card_id: number) {
        if (card_id == -1) { // Deck selected

        } else {
            const leader_id = RegroupChickenArmy.game.leader_id;
            const availableCoins = RegroupChickenArmy.game.playerAreas.at(leader_id).panel.resourcePanel.coinCount;
            const cardCost = 2 - card_id;
            if (availableCoins < cardCost) {
                RegroupChickenArmy.game.showMessage(_(`You can't afford this card`),"error");
                return;
            }
        }
    }

    override addEventListeners(): void {
        this.addEventToElement(this.deck, "click", () => this.preSelectCard(-1));
        for (let i = 0; i < 3; i++) {
            this.addEventToElement(this.cards[i], "click", () => this.preSelectCard(i));
        }
    }
}
