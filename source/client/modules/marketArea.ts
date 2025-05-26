import { RegroupChickenArmy } from '../regroupchickenarmy';
import { MouseHitbox } from '../framework/utils/mouseHitbox';
import { ListenerElement } from '../framework/elements/listenerElement';
import { GameEventTypes, ListenerConfig } from '../framework/types';
import { Cards, Card } from './cards';
import { makeHtmlElementSelectable, removeHtmlElementSelectable } from '../framework/elements/behaviours/selectable';

export class MarketArea extends ListenerElement {
    PARENT_ID = 'centralArea';
    ELEMENT_ID = 'market';

    override get renderWithParent() {
        return false;
    }

    get listeners() {
        return {
            marketUpdate: { callback: this.doUpdateMarket },
            deckCardPicked: { callback: this.doBlockMarket },
        };
    }

    override HTML_DEFINITION: string = `
    <div id="${this.ELEMENT_ID}">
        <div id="deck" class="deck sprite card" data-card-id="0"></div>
        <div id="market_cost_0" class="sprite gui coin2"></div>
        <div id="market_cost_1" class="sprite gui coin1"></div>
    </div>`;

    deck: HTMLDivElement;
    cards: HTMLDivElement[] = [null, null, null];

    cardRotationWindow: CardRotationWindow = null;

    override afterRenderThis() {
        this.deck = document.getElementById('deck') as HTMLDivElement;
        this.renderCards();
    }

    renderCards() {
        const cardsHtml = `
        <div id="market_card_0" class="sprite card" data-card-id="0"></div>
        <div id="market_card_1" class="sprite card" data-card-id="0"></div>
        <div id="market_card_2" class="sprite card" data-card-id="0"></div>`;
        this.cards.forEach((c) => c?.remove());
        this.element.insertAdjacentHTML('beforeend', cardsHtml);
        this.cards[0] = document.getElementById('market_card_0') as HTMLDivElement;
        this.cards[1] = document.getElementById('market_card_1') as HTMLDivElement;
        this.cards[2] = document.getElementById('market_card_2') as HTMLDivElement;
        this.prepareAvailableCards();
    }

    prepareAvailableCards() {
        if (RegroupChickenArmy.game.board.isActive) {
            makeHtmlElementSelectable(this.deck);
            for (let i = 0; i < 3; i++) {
                const leader_id = RegroupChickenArmy.game.getLeaderIdFromPlayerId();
                const availableCoins = RegroupChickenArmy.game.playerAreas.at(leader_id).panel.resourcePanel.coinCount;
                const cardCost = 2 - i;
                if (availableCoins >= cardCost) {
                    makeHtmlElementSelectable(this.cards[i]);
                } else {
                    removeHtmlElementSelectable(this.cards[i]);
                }
                this.addEventToElement(this.cards[i], 'click', () => this.preSelectCard(i, 0));
            }
        } else {
            removeHtmlElementSelectable(this.deck);
        }
    }

    async doUpdateMarket(args: BGA.Notif<'marketUpdate'>['args']): Promise<void> {
        this.renderCards();
        for (let key in args.cards) {
            const card = args.cards[key];
            const card_key = 2 - Number(key);
            this.cards[card_key].dataset['cardId'] = `${card.card_id}`;
        }
        const cardsCount = args.cardsInDeck;
        this.deck.style.setProperty('--cardCount', `${cardsCount}`);
        if (cardsCount == 0) {
            this.deck.classList.add('empty');
        }
    }

    async doBlockMarket(args: BGA.Notif<'deckCardPicked'>['args']): Promise<void> {
        if (args.player_id == RegroupChickenArmy.game.player_id) {
            if (RegroupChickenArmy.game.isInterfaceUnlocked()) {
                this.preSelectCard(-1, args.card_id);
            }
        }
    }

    public pickDeckCard() {
        RegroupChickenArmy.game.ajaxAction(`pickDeckCard`, {}, async function () {
            RegroupChickenArmy.game.marketArea.disableEvents();
        });
    }

    public async preSelectCard(marketCard_order: number, deckCardId: number = 0) {
        if (this.cardRotationWindow !== null) {
            this.cancelCardPlacement();
            this.cards.forEach((c) => {
                c.style.opacity = '1';
            });
        }
        let cardId: number;
        if (marketCard_order >= 0) {
            const card = this.cards[marketCard_order];
            const leader_id = RegroupChickenArmy.game.getLeaderIdFromPlayerId();
            const availableCoins = RegroupChickenArmy.game.playerAreas.at(leader_id).panel.resourcePanel.coinCount;
            const cardCost = 2 - marketCard_order;
            if (availableCoins < cardCost) {
                RegroupChickenArmy.game.showMessage(_(`You don't have enough coins to buy this card`), 'error');
                return;
            }
            cardId = Number(card.dataset['cardId']);
            card.style.opacity = '0';
        } else {
            cardId = deckCardId;
            if (cardId > 0) {
                this.disableEvents();
                this.element.classList.add('deckCardPicked');
            }
        }
        // At this point the card is buyable or is the deck
        RegroupChickenArmy.game.board.centralArea.expand();
        this.cardRotationWindow = new CardRotationWindow(cardId);
        this.cardRotationWindow.render();
    }

    override addEventListeners(): void {
        this.addEventToElement(this.deck, 'click', () => this.preSelectCard(-1, 0));
    }

    public async confirmCardPlacement() {
        const card = document.getElementById('placedCard') as HTMLDivElement;
        const card_id = Number(card.dataset['cardId']);
        const rotation = Number(card.style.getPropertyValue('--rotation'));
        const pos_x = Number(card.dataset['x']);
        const pos_y = Number(card.dataset['y']);

        const _this = this;
        RegroupChickenArmy.game.ajaxAction(
            `putCard`,
            {
                card_id: card_id,
                rotation: rotation,
                pos_x: pos_x,
                pos_y: pos_y,
            },
            async function () {
                const marketCard = RegroupChickenArmy.game.board.centralArea.marketArea.cards.find(
                    (c) => Number(c.dataset['cardId']) === card_id,
                );
                if (marketCard) {
                    marketCard.remove();
                }
                _this.cardRotationWindow?.destroy();
                _this.cardRotationWindow = null;
                RegroupChickenArmy.game.board.centralArea.collapse();
                RegroupChickenArmy.game.removeActionButtons();
                card.remove();
                const grid = RegroupChickenArmy.game.playerAreas.at(
                    RegroupChickenArmy.game.getLeaderIdFromPlayerId(),
                ).grid;
                grid.addCardToGrid(card_id, pos_x, pos_y, rotation);
                grid.createCardOnGrid(card_id, pos_x, pos_y, rotation);
                grid.resizeGrid();
                RegroupChickenArmy.game.marketArea.element.classList.remove('deckCardPicked');
            },
        );
    }

    public async cancelCardPlacement() {
        const element = document.getElementById('placedCard');
        let card_id;
        if (element != null) {
            card_id = Number(element.dataset['cardId'] ?? 0);
            element.remove();
        }
        RegroupChickenArmy.game.board.centralArea.marketArea.cardRotationWindow?.destroy();
        RegroupChickenArmy.game.board.centralArea.marketArea.cardRotationWindow = null;
        RegroupChickenArmy.game.board.centralArea.marketArea.cards.forEach((c) => {
            c.style.opacity = '1';
        });
        RegroupChickenArmy.game.board.centralArea.collapse();
        RegroupChickenArmy.game.removeActionButtons();

        if (
            RegroupChickenArmy.game.board.centralArea.marketArea.element.classList.contains('deckCardPicked') &&
            card_id != undefined
        ) {
            RegroupChickenArmy.game.board.centralArea.marketArea.preSelectCard(-1, card_id);
        }
    }
}

export class CardRotationWindow extends ListenerElement {
    get listeners(): ListenerConfig {
        return {
            cardPrePlaced: { callback: this.doCardPrePlaced, isCustomEvent: true },
        };
    }

    PARENT_ID = `centralArea`;
    ELEMENT_ID = `cardRotationArea`;
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}">
        <div id="cardRotation_ccw" class="cardRotation_btn">
        <div class="selectable"></div>
        </div>
        <div id="cardRotation_cw" class="cardRotation_btn">
        <div class="selectable"></div>
        </div>
    </div>`;

    card: Card;
    cardRotation_ccw: HTMLDivElement;
    cardRotation_cw: HTMLDivElement;

    public override afterRenderThis(force: boolean): void {
        this.card = new Card(this.id, this.ELEMENT_ID, 'cardRotation_card', Cards[this.id as keyof Cards]);
        this.card.render();
        this.cardRotation_ccw = document.getElementById('cardRotation_ccw') as HTMLDivElement;
        this.cardRotation_cw = document.getElementById('cardRotation_cw') as HTMLDivElement;
        RegroupChickenArmy.game.removeActionButtons();
        this.enableRotationButtons();
        if (this.id == 0) {
            this.disableRotationButtons();
            RegroupChickenArmy.game.addActionButton(
                'confirmDeckPick_btn',
                _('Pick card from deck'),
                RegroupChickenArmy.game.board.centralArea.marketArea.pickDeckCard,
            );
        }
    }

    protected override addEventListeners(): void {
        this.addEventToElement(this.cardRotation_ccw, 'click', () => this.card.rotate(-1));
        this.addEventToElement(this.cardRotation_cw, 'click', () => this.card.rotate(1));

        if (this.id !== 0) {
            // Show posible placements
            const leader_id = RegroupChickenArmy.game.getLeaderIdFromPlayerId();
            const grid = RegroupChickenArmy.game.playerAreas.at(leader_id).grid;
            const cells = Array.from(grid.gridDiv.querySelectorAll('.cell.active')) as HTMLElement[];
            const scale = grid.scrollmap.zoom;
            MouseHitbox.instance.startSession(leader_id, 50 * scale * 0.95, cells, true);
            this.enableRotationButtons();
        } else {
            MouseHitbox.instance.stopSession();
        }
    }

    public disableRotationButtons() {
        this.cardRotation_ccw.style.display = 'none';
        this.cardRotation_cw.style.display = 'none';
    }

    public enableRotationButtons() {
        this.cardRotation_ccw.style.display = 'block';
        this.cardRotation_cw.style.display = 'block';
    }

    async doCardPrePlaced(event: GameEventTypes['cardPrePlaced']): Promise<void> {
        if (this.id == event.cardId) {
            MouseHitbox.instance.stopSession();
            this.card.hide();
            this.disableRotationButtons();
            RegroupChickenArmy.game.addActionButton(
                'confirmCardPlacement_btn',
                _('Place card'),
                RegroupChickenArmy.game.board.centralArea.marketArea.confirmCardPlacement,
            );
            RegroupChickenArmy.game.addActionButton(
                'cancelCardPlacement_btn',
                _('Cancel'),
                RegroupChickenArmy.game.board.centralArea.marketArea.cancelCardPlacement,
            );
        }
    }
}
