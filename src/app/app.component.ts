import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { TreeChildComponent } from "./components/tree-child/tree-child.component";
import { TreeNode } from "./models/tree-node.interface";
import { TreeDataService } from "./services/tree-data.service";
import { VisibilityService } from "./services/visibility.service";
import { VisibilityTrackerDirective } from "./directives/visibility-tracker.directive";
import { isNil, keys, pickBy } from "lodash";

export interface FlatArrayItem {
  type: "parent" | "child";
  id: string;
  level: number;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [TreeChildComponent, CommonModule, VisibilityTrackerDirective],
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

  /**
   * Track visibility changes for items by index
   */
  onVisibilityChange(id: string, isVisible: boolean): void {
    const beforeValue = this.visibleNodes[id];
    this.visibleNodes[id] = isVisible;

    if (!isNil(beforeValue)) {
      this.updateIndexRange();
    }
  }

  updateIndexRange(): void {
    const visibleItems = this.getVisibleLength();
    console.log("visibleItems", visibleItems);
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

    this.startIndex = Math.max(0, firstVisibleIndex - visibleItems);
    this.endIndex = Math.min(
      this.flatArray.length,
      lastVisibleIndex + visibleItems + 1
    );
  }

  getVisibleLength(): number {
    return keys(pickBy(this.visibleNodes, Boolean)).length;
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
      });

      if (this.isParentOpen(parent.id)) {
        const children = this.treeDataService.getChildren(parent);

        children.forEach((child) => {
          // Add parent
          result.push({
            type: child.type,
            id: child.id,
            level: 1,
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
