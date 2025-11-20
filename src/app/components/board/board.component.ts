import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { isEmpty, isNil, keys, values } from "lodash";
import { VisibilityTrackerDirective } from "../../directives/visibility-tracker.directive";
import { IndeterminateCheckboxDirective } from "../../directives/indeterminate-checkbox.directive";
import { TreeNode } from "../../models/tree-node.interface";
import { TreeDataService } from "../../services/tree-data.service";
import { VisibilityService } from "../../services/visibility.service";

export interface FlatArrayItem {
  type: "parent" | "child";
  id: string;
  level: number;
  currentParentId: string;
}

@Component({
  selector: "app-board",
  standalone: true,
  imports: [
    CommonModule,
    VisibilityTrackerDirective,
    IndeterminateCheckboxDirective,
  ],
  templateUrl: "./board.component.html",
  styleUrl: "./board.component.less",
})
export class BoardComponent implements OnInit, OnDestroy {
  title = "Board View";
  flatArray: FlatArrayItem[] = [];
  originalArray: FlatArrayItem[] = [];
  parentOpenState: Record<string, boolean> = {};
  visibleNodes: Record<string, boolean> = {};
  selectedNodeIds: Set<string> = new Set();
  lastSelectedNodeId: string | null = null;

  firstVisibleIndex: number = 0;
  lastVisibleIndex: number = 0;

  startIndex: number = 0;
  buffer = 40;
  endIndex: number = this.startIndex + this.buffer;

  rowHeight = 60; // px – תתאים למה שיש לך ב-CSS

  maxCardsPerRow: number = 4;

  @ViewChild("treeList", { read: ElementRef })
  treeListRef?: ElementRef<HTMLDivElement>;

  constructor(
    private treeDataService: TreeDataService,
    public visibilityService: VisibilityService
  ) {}

  ngOnInit(): void {
    this.flatArray = this.generateFlatArray();
    this.originalArray = [...this.flatArray];
    this.setupKeyboardListeners();
  }

  ngOnDestroy(): void {
    this.removeKeyboardListeners();
  }

  private setupKeyboardListeners(): void {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  private removeKeyboardListeners(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Ctrl+A or Cmd+A to select all
    if ((event.ctrlKey || event.metaKey) && event.key === "a") {
      event.preventDefault();
      this.selectAll();
    }
  };

  scrollToIndex(index: number): void {
    const container = this.treeListRef?.nativeElement;
    if (!container) return;

    const targetScrollTop = index * this.rowHeight;
    container.scrollTop = targetScrollTop;
  }

  findOriginalIndex(id: string): number {
    return this.originalArray.findIndex((item) => item.id === id);
  }

  timeout: any = null;
  /**
   * Track visibility changes for items by index
   */

  getStarIndexByScrollPosition(): number {
    const el = this.treeListRef?.nativeElement;
    if (!el) return this.startIndex;

    const scrollTop = el.scrollTop;
    const maxScroll = el.scrollHeight - el.clientHeight;

    const scrollPercent = scrollTop / maxScroll;

    const newStart = this.getStartIndexFromScrollPercent(scrollPercent);

    return newStart;
  }

  getStartIndexFromScrollPercent(scrollPercent: number): number {
    const total = this.flatArray.length;
    const maxStart = total - this.buffer;

    return Math.floor(scrollPercent * maxStart);
  }

  onScroll() {
    if (isEmpty(values(this.visibleNodes))) {
      const idx = this.getStarIndexByScrollPosition();

      this.startIndex = idx;
      this.endIndex = this.startIndex + this.buffer;

      this.scrollToIndex(this.startIndex);
    }
  }

  onVisibilityChange(id: string, isVisible: boolean): void {
    if (isVisible) {
      this.visibleNodes[id] = true;
    } else {
      delete this.visibleNodes[id];
    }
    if (this.visibleNodes[id]) {
      this.updateIndexRange();
    }
  }
  getBgColor(item: FlatArrayItem): string {
    const parent = this.treeDataService.getAllNodes()[item.currentParentId];
    const itemIndexInChildren = parent?.childrenIds?.indexOf(item.id)!;
    const itemIndexInRow = itemIndexInChildren % this.maxCardsPerRow;

    if (itemIndexInRow === 0) {
      return "rgba(236, 72, 153, 0.2)";
    } else if (itemIndexInRow === 1) {
      return "rgba(59, 130, 246, 0.2)";
    } else if (itemIndexInRow === 2) {
      return "rgba(139, 92, 246, 0.2)";
    } else {
      return "rgba(72, 236, 113, 0.2)";
    }
  }

  getElementStartOfRowIndex(item: FlatArrayItem): number {
    const parent = this.treeDataService.getAllNodes()[item.currentParentId];
    const itemIndexInChildren = parent?.childrenIds?.indexOf(item.id)!;
    const itemIndexInRow = itemIndexInChildren % this.maxCardsPerRow;
    const startOfRowIndex = itemIndexInChildren - itemIndexInRow;
    const startOfRowItemId = parent?.childrenIds?.[startOfRowIndex];

    return this.flatArray.findIndex((i) => i.id === startOfRowItemId);
  }

  updateIndexRange(): void {
    if ((this.treeListRef?.nativeElement as HTMLDivElement).scrollTop === 0) {
      (this.treeListRef?.nativeElement as HTMLDivElement).scrollTop = 1;
    }

    const visibleItems = this.getVisibleLength();
    let firstVisibleIndex: number | undefined;
    let lastVisibleIndex: number | undefined;

    this.flatArray.forEach((item, index) => {
      if (this.visibleNodes[item.id]) {
        if (isNil(firstVisibleIndex)) firstVisibleIndex = index;
        lastVisibleIndex = index;
      }
    });

    if (isNil(firstVisibleIndex) || isNil(lastVisibleIndex)) {
      console.error("No visible items found");
      return;
    }

    this.firstVisibleIndex = firstVisibleIndex;
    this.lastVisibleIndex = lastVisibleIndex;

    const startIndex = Math.max(0, firstVisibleIndex - visibleItems);
    const item = this.flatArray[startIndex];

    if (item.type === "child") {
      this.startIndex = this.getElementStartOfRowIndex(item);
    } else {
      this.startIndex = startIndex;
    }

    this.endIndex = Math.min(
      this.flatArray.length,
      lastVisibleIndex + visibleItems
    );
  }

  getVisibleLength(): number {
    return keys(this.visibleNodes).length;
  }

  /**
   * Calculate scrollbar thumb position as percentage
   */
  getScrollbarTop(): number {
    if (this.flatArray.length === 0) return 0;
    return (this.firstVisibleIndex / this.flatArray.length) * 100;
  }

  get topSpacerHeight(): number {
    return this.startIndex * this.rowHeight;
  }

  get bottomSpacerHeight(): number {
    return (this.flatArray.length - this.endIndex) * this.rowHeight;
  }

  /**
   * Calculate scrollbar thumb height as percentage
   */
  getScrollbarHeight(): number {
    if (this.flatArray.length === 0) return 0;
    const visibleRange = this.lastVisibleIndex - this.firstVisibleIndex + 1;
    return (visibleRange / this.flatArray.length) * 100;
  }

  /**
   * Toggle a parent's open/closed state
   */
  toggleParent(parentId: string): void {
    this.parentOpenState[parentId] = isNil(this.parentOpenState[parentId])
      ? false
      : !this.parentOpenState[parentId];

    this.flatArray = this.generateFlatArray();

    this.endIndex = this.startIndex + this.getVisibleLength();
  }

  /**
   * Check if a parent is open
   */
  isParentOpen(parentId: string): boolean {
    return this.parentOpenState[parentId] ?? true;
  }

  /**
   * Generate a completely flat array with hierarchy
   * Structure: grandparent -> parents -> children
   */
  private generateFlatArray(): FlatArrayItem[] {
    const result: FlatArrayItem[] = [];
    const firstParentNodes = this.treeDataService.getFirstParentNodes();

    firstParentNodes.forEach((parent) => {
      // Add grand parent
      result.push({
        type: parent.type,
        id: parent.id,
        level: 0,
        currentParentId: "root",
      });

      if (this.isParentOpen(parent.id)) {
        const children = this.treeDataService.getChildren(parent);

        children.forEach((child) => {
          // Add parent
          result.push({
            type: child.type,
            id: child.id,
            level: 1,
            currentParentId: parent.id,
          });

          // Add each child of this parent if parent is open
          // Children only store ID, not the full node (lazy loaded)
          if (child.type === "parent" && this.isParentOpen(child.id)) {
            const grandChildren = this.treeDataService.getChildren(child);
            grandChildren.forEach((node) => {
              result.push({
                type: node.type,
                id: node.id,
                level: 2,
                currentParentId: child.id,
              });
            });
          }
        });
      }
    });

    return result;
  }

  /**
   * Get a node by ID
   */
  getNode(id: number): TreeNode | undefined {
    return this.treeDataService.getAllNodes()[id];
  }

  /**
   * Select a card (child node) with support for Ctrl and Shift modifiers
   */
  selectCard(nodeId: string, event: MouseEvent): void {
    const node = this.flatArray.find((n) => n.id === nodeId);
    if (!node || node.type !== "child") return;

    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: Toggle selection
      const newSelection = new Set(this.selectedNodeIds);
      if (newSelection.has(nodeId)) {
        newSelection.delete(nodeId);
      } else {
        newSelection.add(nodeId);
      }
      this.selectedNodeIds = newSelection;
      this.lastSelectedNodeId = nodeId;
    } else if (event.shiftKey && this.lastSelectedNodeId) {
      // Shift+Click: Range selection
      const newSelection = new Set(this.selectedNodeIds);
      this.selectRange(this.lastSelectedNodeId, nodeId, newSelection);
      this.selectedNodeIds = newSelection;
    } else {
      // Normal click: Select only this one
      this.selectedNodeIds = new Set([nodeId]);
      this.lastSelectedNodeId = nodeId;
    }
  }

  /**
   * Select a range of child nodes between two IDs
   * If a closed parent is in the range, all its children are selected
   */
  private selectRange(
    fromId: string,
    toId: string,
    targetSet: Set<string>
  ): void {
    const fromIndex = this.flatArray.findIndex((n) => n.id === fromId);
    const toIndex = this.flatArray.findIndex((n) => n.id === toId);

    if (fromIndex === -1 || toIndex === -1) return;

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    for (let i = start; i <= end; i++) {
      const node = this.flatArray[i];

      if (node.type === "child") {
        // It's a leaf node, select it
        targetSet.add(node.id);
      } else if (node.type === "parent") {
        // It's a parent node
        if (!this.isParentOpen(node.id)) {
          // Parent is closed, select all its leaf children recursively
          const leafChildren = this.getAllLeafChildren(node.id);
          leafChildren.forEach((childId) => {
            targetSet.add(childId);
          });
        }
        // If parent is open, its children will be in the flatArray
        // and will be selected in subsequent iterations
      }
    }
  }

  /**
   * Select all child nodes
   */
  selectAll(): void {
    const newSelection = new Set<string>();
    this.flatArray.forEach((node) => {
      if (node.type === "child") {
        newSelection.add(node.id);
      }
    });
    this.selectedNodeIds = newSelection;
  }

  /**
   * Check if a card is selected
   */
  isCardSelected(nodeId: string): boolean {
    return this.selectedNodeIds.has(nodeId);
  }

  /**
   * Get all leaf child nodes recursively under a parent
   */
  private getAllLeafChildren(parentId: string): string[] {
    const leafChildren: string[] = [];
    const allNodes = this.treeDataService.getAllNodes();
    const parent = allNodes[parentId];

    if (!parent || parent.type !== "parent" || !parent.childrenIds) {
      return leafChildren;
    }

    parent.childrenIds.forEach((childId) => {
      const child = allNodes[childId];
      if (!child) return;

      if (child.type === "child") {
        // It's a leaf node, add it
        leafChildren.push(childId);
      } else if (child.type === "parent") {
        // It's a parent, recurse
        leafChildren.push(...this.getAllLeafChildren(childId));
      }
    });

    return leafChildren;
  }

  /**
   * Toggle selection of all children of a parent (recursive)
   */
  toggleParentSelection(parentId: string, event: Event): void {
    event.stopPropagation(); // Prevent parent toggle from firing
    event.preventDefault();

    const parent = this.treeDataService.getAllNodes()[parentId];

    if (!parent || !parent.childrenIds || parent.type !== "parent") {
      return;
    }

    // Get all leaf children recursively
    const allLeafChildren = this.getAllLeafChildren(parentId);
    const allSelected = this.areAllChildrenSelected(parentId);

    // Create a new Set to ensure change detection
    const newSelection = new Set(this.selectedNodeIds);

    allLeafChildren.forEach((childId) => {
      if (allSelected) {
        newSelection.delete(childId);
      } else {
        newSelection.add(childId);
      }
    });

    this.selectedNodeIds = newSelection;
  }

  /**
   * Check if all leaf children of a parent are selected (recursive)
   */
  areAllChildrenSelected(parentId: string): boolean {
    const allLeafChildren = this.getAllLeafChildren(parentId);

    if (allLeafChildren.length === 0) {
      return false;
    }

    return allLeafChildren.every((childId) =>
      this.selectedNodeIds.has(childId)
    );
  }

  /**
   * Check if some (but not all) leaf children of a parent are selected (recursive)
   */
  areSomeChildrenSelected(parentId: string): boolean {
    const allLeafChildren = this.getAllLeafChildren(parentId);

    if (allLeafChildren.length === 0) {
      return false;
    }

    const selectedCount = allLeafChildren.filter((childId) =>
      this.selectedNodeIds.has(childId)
    ).length;

    return selectedCount > 0 && selectedCount < allLeafChildren.length;
  }
}
