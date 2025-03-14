import { ListenerElement } from "../utils/listenerElement";

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
        <div id="market_card_0" class="card" data-card-id="41"></div>
        <div id="market_card_1" class="card" data-card-id="21"></div>
        <div id="market_card_2" class="card" data-card-id="7"></div>
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
}
