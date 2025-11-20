import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { TreeDataService } from "../../services/tree-data.service";
import { TreeNode } from "../../models/tree-node.interface";

@Component({
  selector: "app-card-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./card-list.component.html",
  styleUrl: "./card-list.component.less",
})
export class CardListComponent implements OnInit {
  title = "Card List View";
  cards: string[] = [];
  selectedCardIds: Set<string> = new Set();

  constructor(private treeDataService: TreeDataService) {}

  ngOnInit(): void {
    this.loadAllCards();
  }

  /**
   * Load all child cards (leaf nodes) from the tree
   */
  loadAllCards(): void {
    this.cards = Array.from({ length: 20 }, (_, index) => `Card ${index + 1}`);
  }

  /**
   * Toggle card selection
   */
  toggleCard(cardId: string, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: Toggle selection
      const newSelection = new Set(this.selectedCardIds);
      if (newSelection.has(cardId)) {
        newSelection.delete(cardId);
      } else {
        newSelection.add(cardId);
      }
      this.selectedCardIds = newSelection;
    } else {
      // Normal click: Select only this one
      this.selectedCardIds = new Set([cardId]);
    }
  }

  /**
   * Check if a card is selected
   */
  isSelected(cardId: string): boolean {
    return this.selectedCardIds.has(cardId);
  }

  /**
   * Get background color for card based on index
   */
  getCardColor(index: number): string {
    const colors = [
      "rgba(236, 72, 153, 0.2)", // Pink
      "rgba(59, 130, 246, 0.2)", // Blue
      "rgba(139, 92, 246, 0.2)", // Purple
      "rgba(72, 236, 113, 0.2)", // Green
    ];
    return colors[index % colors.length];
  }

  /**
   * Get parent name for a card
   */
  getParentName(parentId: string | undefined): string {
    if (!parentId) return "Unknown";
    const allNodes = this.treeDataService.getAllNodes();
    return allNodes[parentId]?.name || parentId;
  }
}
