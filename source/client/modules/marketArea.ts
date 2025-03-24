import { RegroupChickenArmy } from "../regroupchickenarmy";
import { GameElement } from "../utils/gameElement";
import { delay } from "../utils/gameUtils";
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
        <div id="deck" class="deck card" data-card-id="0"></div>
        <div id="market_card_0" class="card" data-card-id="0"></div>
        <div id="market_card_1" class="card" data-card-id="0"></div>
        <div id="market_card_2" class="card" data-card-id="0"></div>
        <div id="market_cost_0"></div>
        <div id="market_cost_1"></div>
    </div>`;

    deck: HTMLDivElement;
    cards: HTMLDivElement[] = [null, null, null];

    cardRotationWindow: CardRotationWindow = null;

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

    public pickDeckCard() {
        RegroupChickenArmy.game.ajaxcall(`/${RegroupChickenArmy.game.game_name}/${RegroupChickenArmy.game.game_name}/pickDeckCard.html`, {},
            this, async function () {

            });
    }

    private async preSelectCard(card_id: number) {
        if (this.cardRotationWindow !== null) {
            this.cardRotationWindow.destroy();
            this.cardRotationWindow = null;
            this.cards.forEach(c => {
                c.style.opacity = '1';
            })
        }
        let card;
        if (card_id >= 0) {
            card = this.cards[card_id];
            const leader_id = RegroupChickenArmy.game.leader_id;
            const availableCoins = RegroupChickenArmy.game.playerAreas.at(leader_id).panel.resourcePanel.coinCount;
            const cardCost = 2 - card_id;
            if (availableCoins < cardCost) {
                RegroupChickenArmy.game.showMessage(_(`You can't afford this card`), "error");
                return;
            }
        } else {
            card = this.deck;
        }
        // At this point the card is buyable or is the deck
        RegroupChickenArmy.game.board.element.classList.add("centralAreaExpanded");
        this.cardRotationWindow = new CardRotationWindow(Number(card.dataset["cardId"]));
        if (card_id >= 0) {
            card.style.opacity = '0';
        }
        this.cardRotationWindow.render();
        this.cardRotationWindow.element.style.opacity = '1';
    }

    override addEventListeners(): void {
        this.addEventToElement(this.deck, "click", () => this.preSelectCard(-1));
        for (let i = 0; i < 3; i++) {
            this.addEventToElement(this.cards[i], "click", () => this.preSelectCard(i));
        }
    }
}

export class CardRotationWindow extends GameElement {
    PARENT_ID = `centralArea`;
    ELEMENT_ID = `cardRotationArea`;
    htmlDefinition = `<div id="${this.ELEMENT_ID}" style="opacity:0;">
        <div id="cardRotation_card" class="card" data-card-id="${this.id}"></div>
        <div id="cardRotation_ccw" class="cardRotation_btn"></div>
        <div id="cardRotation_cw" class="cardRotation_btn"></div>
    </div>`;

    card: HTMLDivElement;
    cardRotation_ccw: HTMLDivElement;
    cardRotation_cw: HTMLDivElement;

    public override afterRender(force: boolean): void {
        this.card = document.getElementById("cardRotation_card") as HTMLDivElement;
        this.cardRotation_ccw = document.getElementById("cardRotation_ccw") as HTMLDivElement;
        this.cardRotation_cw = document.getElementById("cardRotation_cw") as HTMLDivElement;
        RegroupChickenArmy.game.removeActionButtons();
        if (this.id == 0) {
            this.cardRotation_ccw.style.display = "none";
            this.cardRotation_cw.style.display = "none";
            RegroupChickenArmy.game.addActionButton("confirmDeckPick_btn", _('Pick card from deck'), RegroupChickenArmy.game.marketArea.pickDeckCard);
        }
    }

    protected override addEventListeners(): void {

    }
}