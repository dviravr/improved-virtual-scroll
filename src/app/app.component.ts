import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { isNil, keys } from "lodash";
import { VisibilityTrackerDirective } from "./directives/visibility-tracker.directive";
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
  imports: [CommonModule, VisibilityTrackerDirective],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.less",
})
export class AppComponent implements OnInit {
  title = "ad-demo";
  flatArray: FlatArrayItem[] = [];
  originalArray: FlatArrayItem[] = [];
  parentOpenState: Record<string, boolean> = {};
  visibleNodes: Record<string, boolean> = {};

  startIndex: number = 0;
  endIndex: number = 40;

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
  }

  findOriginalIndex(id: string): number {
    return this.originalArray.findIndex((item) => item.id === id);
  }

  timeout: any = null;
  /**
   * Track visibility changes for items by index
   */
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
}
