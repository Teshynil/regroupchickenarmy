import { RegroupChickenArmy } from "../regroupchickenarmy";
import { GameElement } from "../utils/gameElement";
import { delay } from "../utils/gameUtils";
import { ListenerElement } from "../utils/listenerElement";
import { Cards, Card } from "./cards";

export class MarketArea extends ListenerElement {
    PARENT_ID = "centralArea";
    ELEMENT_ID = "market";

    get listeners() {
        return {
            "marketUpdate": { callback: this.doUpdateMarket },
            "deckCardPicked": { callback: this.doBlockMarket }
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

    doBlockMarket(notif: BGA.Notif<"deckCardPicked">) {
        if (notif.args.player_id == RegroupChickenArmy.game.player_id) {
            this.preSelectCard(-1, notif.args.card_id);
        }
    }

    public pickDeckCard() {
        RegroupChickenArmy.game.ajaxcall(`/${RegroupChickenArmy.game.game_name}/${RegroupChickenArmy.game.game_name}/pickDeckCard.html`, {},
            this, async function () {
                this.disableEvents();
            });
    }

    public async preSelectCard(marketCard_order: number, deckCardId: number = 0) {
        if (this.cardRotationWindow !== null) {
            this.cardRotationWindow.destroy();
            this.cardRotationWindow = null;
            this.cards.forEach(c => {
                c.style.opacity = '1';
            })
        }
        let cardId: number;
        if (marketCard_order >= 0) {
            const card = this.cards[marketCard_order];
            const leader_id = RegroupChickenArmy.game.getLeaderIdFromPlayerId();
            const availableCoins = RegroupChickenArmy.game.playerAreas.at(leader_id).panel.resourcePanel.coinCount;
            const cardCost = 2 - marketCard_order;
            if (availableCoins < cardCost) {
                RegroupChickenArmy.game.showMessage(_(`You can't afford this card`), "error");
                return;
            }
            cardId = Number(card.dataset["cardId"]);
            card.style.opacity = '0';
        } else {
            cardId = deckCardId;
            if (cardId > 0) {
                this.disableEvents();
                this.element.classList.add("deckCardPicked");
            }
        }
        // At this point the card is buyable or is the deck
        RegroupChickenArmy.game.board.element.classList.add("centralAreaExpanded");
        this.cardRotationWindow = new CardRotationWindow(cardId);
        this.cardRotationWindow.render();
    }

    override addEventListeners(): void {
        this.addEventToElement(this.deck, "click", () => this.preSelectCard(-1, 0));
        for (let i = 0; i < 3; i++) {
            this.addEventToElement(this.cards[i], "click", () => this.preSelectCard(i, 0));
        }
    }
}

export class CardRotationWindow extends GameElement {
    PARENT_ID = `centralArea`;
    ELEMENT_ID = `cardRotationArea`;
    htmlDefinition = `<div id="${this.ELEMENT_ID}">
        <div id="cardRotation_ccw" class="cardRotation_btn"></div>
        <div id="cardRotation_cw" class="cardRotation_btn"></div>
    </div>`;

    card: Card;
    cardRotation_ccw: HTMLDivElement;
    cardRotation_cw: HTMLDivElement;

    public override afterRender(force: boolean): void {
        this.card = new Card(this.id, this.ELEMENT_ID, "cardRotation_card", Cards[this.id as keyof Cards]);
        this.card.render();
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
        this.addEventToElement(this.cardRotation_ccw, "click", () => this.card.rotate(-1));
        this.addEventToElement(this.cardRotation_cw, "click", () => this.card.rotate(1));

        if (this.id !== 0) {
            this.card.isDraggable = true;
        }
    }
}