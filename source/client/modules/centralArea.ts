import { GameElement } from "../utils/gameElement";
import { MarketArea } from "./marketArea";
import { LeaderSelection } from "./leaderSelection";

export class CentralArea extends GameElement {
    PARENT_ID = "board";
    ELEMENT_ID = "centralArea";
    HTML_DEFINITION = `<div id="${this.ELEMENT_ID}"></div>`;

    marketArea: MarketArea;
    leaderSelection: LeaderSelection;

    constructor() {
        super(0);
        // Create child components with parent-child relationship
        this.marketArea = MarketArea.createChild(this, 0);
        this.leaderSelection = LeaderSelection.createChild(this, 0);
    }

    // No need to manually render child components as they will be automatically rendered

    /**
     * Expands the central area to show more content
     * Note: The actual CSS class is added to the board element
     */
    expand(): void {
        const boardElement = document.getElementById("board");
        if (boardElement) {
            boardElement.classList.add("centralAreaExpanded");
        }
    }

    /**
     * Collapses the central area back to normal size
     * Note: The actual CSS class is removed from the board element
     */
    collapse(): void {
        const boardElement = document.getElementById("board");
        if (boardElement) {
            boardElement.classList.remove("centralAreaExpanded");
        }
    }

    /**
     * Toggles the expansion state of the central area
     */
    toggleExpansion(): void {
        const boardElement = document.getElementById("board");
        if (boardElement) {
            boardElement.classList.toggle("centralAreaExpanded");
        }
    }
}
