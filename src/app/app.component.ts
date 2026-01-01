import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { chunk, isNil, keys, sum } from "lodash";
import { IndeterminateCheckboxDirective } from "./directives/indeterminate-checkbox.directive";
import { TreeNode } from "./models/tree-node.interface";
import { TreeDataService } from "./services/tree-data.service";
import { VisibilityService } from "./services/visibility.service";

export interface FlatArrayItem {
  type: "parent" | "child";
  id: string;
  level: number;
  currentParentId: string;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, IndeterminateCheckboxDirective],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.less",
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = "ad-demo";
  flatArray: FlatArrayItem[] = [];
  originalArray: FlatArrayItem[] = [];
  parentOpenState: Record<string, boolean> = {};
  visibleNodes: Record<string, boolean> = {};
  selectedNodeIds: Set<string> = new Set();
  lastSelectedNodeId: string | null = null;

  gap = 5;

  folderHeight = 54;
  childHeight = 60;

  firstVisibleIndex: number = 0;
  lastVisibleIndex: number = 0;

  boardRows: { id: string; originalIndex: number }[][] = [];
  refPending = false;

  startIndex: number = 0;
  endIndex: number = 0;

  rowHeight = 60; // px – תתאים למה שיש לך ב-CSS

  maxCardsPerRow: number = 4;

  @ViewChild("treeList", { read: ElementRef })
  treeListRef?: ElementRef<HTMLDivElement>;

  constructor(
    private treeDataService: TreeDataService,
    public visibilityService: VisibilityService
  ) {}

  ngAfterViewInit(): void {
    this.updateScrollPosition();
  }

  ngOnInit(): void {
    this.generateFlatArray();
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

  findFlatArrayIndex(id: string): number {
    return this.flatArray.findIndex((item) => item.id === id);
  }

  findOriginalIndex(id: string): number {
    return this.originalArray.findIndex((item) => item.id === id);
  }

  onScroll() {
    if (this.refPending) return;
    this.refPending = true;
    requestAnimationFrame(() => {
      this.refPending = false;
      this.updateScrollPosition();
    });
  }

  calcBoardRows(): void {
    this.boardRows = [];
    const req = (id: string) => {
      const node = this.getNode(id);
      if (!node) return;
      if (node.type === "parent") {
        this.boardRows.push([
          { id, originalIndex: this.findFlatArrayIndex(id) },
        ]);
        const firstChild = node.childrenIds?.[0];
        const childNode = this.flatArray.find((item) => item.id === firstChild);
        if (childNode) {
          if (childNode?.type === "parent") {
            node.childrenIds.forEach((childId) => {
              req(childId);
            });
          } else {
            this.boardRows.push(
              ...chunk(
                node.childrenIds.map((id) => ({
                  id,
                  originalIndex: this.findFlatArrayIndex(id),
                })),
                this.maxCardsPerRow
              )
            );
          }
        }
      }
    };
    this.flatArray
      .filter((item) => item.type === "parent" && item.level === 0)
      .forEach((item) => {
        req(item.id);
      });

    console.log(this.boardRows);
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

  updateScrollPosition(): void {
    const container = this.treeListRef?.nativeElement;
    if (!container) return;

    const targetScrollTop = this.startIndex * this.rowHeight;
    container.scrollTop = targetScrollTop;
  }

  getVisibleLength(): number {
    return this.endIndex - this.startIndex;
  }

  calcSpacerHeight(rows: { id: string; originalIndex: number }[][]): number {
    if (rows.length === 0) return 0;

    return (
      this.gap * (rows.length - 1) +
      sum(
        rows.map((row) => {
          const node = this.getNode(row[0].id);
          if (node?.type === "parent") {
            return this.folderHeight;
          } else {
            return this.childHeight;
          }
        })
      )
    );
  }

  get topSpacerHeight(): number {
    return this.startIndex * this.rowHeight;
  }

  get bottomSpacerHeight(): number {
    return (this.flatArray.length - this.endIndex) * this.rowHeight;
  }

  /**
   * Toggle a parent's open/closed state
   */
  toggleParent(parentId: string): void {
    this.parentOpenState[parentId] = isNil(this.parentOpenState[parentId])
      ? false
      : !this.parentOpenState[parentId];

    this.generateFlatArray();

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
  private generateFlatArray() {
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

    this.flatArray = result;
    this.calcBoardRows();
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): TreeNode | undefined {
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
