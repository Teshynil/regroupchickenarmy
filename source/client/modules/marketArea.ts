export class MarketArea {
    element: HTMLDivElement;
    deck: any;
    card2: any;
    card1: any;
    card0: any;
    render() {
        const centralArea = document.getElementById(`centralArea`);
        if (centralArea == null) throw new Error(`Central Area not found`);
        centralArea.insertAdjacentHTML('beforeend', `
			<div id="market">
                <div id="deck" class="deck card"></div>
                <div id="market_card_0" class="card card_41"></div>
                <div id="market_card_1" class="card card_21"></div>
                <div id="market_card_2" class="card card_11"></div>
                <div id="market_cost_0"></div>
                <div id="market_cost_1"></div>
			</div>
		  `);
        this.element = document.getElementById("market") as HTMLDivElement;
    }
    hide() {
        this.element.style.display = "none";
    }
    show() {
        this.element.style.display = null;
    }
}
