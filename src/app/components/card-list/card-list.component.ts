import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { TreeDataService } from "../../services/tree-data.service";

@Component({
  selector: "app-card-list",
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: "./card-list.component.html",
  styleUrl: "./card-list.component.less",
})
export class CardListComponent implements OnInit {
  title = "Card List View";
  cards: any[] = [];
  selectedCardIds: Set<string> = new Set();

  constructor(private treeDataService: TreeDataService) {}

  ngOnInit(): void {
    this.loadAllCards();
  }

  /**
   * Load all child cards (leaf nodes) from the tree
   */
  loadAllCards(): void {
    this.cards = Array.from({ length: 20 }, (_, index) => ({
      id: `card-${index + 1}`,
      name: `Card ${index + 1}`,
      type: "card",
      matchedWith: null,
    }));
  }

  /**
   * Get array of all card IDs for connecting drop lists
   */
  getCardIds(): string[] {
    return this.cards.map((card) => card.id);
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

  /**
   * Handle drop event when a board card is dropped onto a card-list card
   */
  onCardDrop(event: CdkDragDrop<any[]>, targetCardId: string): void {
    console.log("Card drop event:", event, "Target:", targetCardId);

    // Don't actually move items between containers
    if (event.previousContainer !== event.container) {
      // Find the target card
      const targetCard = this.cards.find((c) => c.id === targetCardId);
      if (!targetCard) return;

      // Get the dragged data
      const draggedData = event.item.data;

      if (draggedData && draggedData.id) {
        // Store the match (copy the reference, don't move the item)
        targetCard.matchedWith = { ...draggedData };
        console.log(
          `Matched ${targetCardId} with board card ${draggedData.id}`
        );
      }
    }
    // Note: We don't call transferArrayItem or moveItemInArray
    // This ensures the original item stays in place
  }

  /**
   * Remove a match
   */
  removeMatch(cardId: string, event: Event): void {
    event.stopPropagation();
    const card = this.cards.find((c) => c.id === cardId);
    if (card) {
      card.matchedWith = null;
    }
  }
}
