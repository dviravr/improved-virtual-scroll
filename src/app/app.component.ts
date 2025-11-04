import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { TreeChildComponent } from "./components/tree-child/tree-child.component";
import { TreeNode } from "./models/tree-node.interface";
import { TreeDataService } from "./services/tree-data.service";

export interface FlatArrayItem {
  type: "parent" | "child";
  id: number;
  level: number;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [TreeChildComponent, CommonModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.less",
})
export class AppComponent implements OnInit {
  title = "ad-demo";
  flatArray: FlatArrayItem[] = [];
  parentOpenState: Record<number, boolean> = {};
  visibleIds: Record<number, boolean> = {};
  visibleItems: FlatArrayItem[] = [];

  constructor(private treeDataService: TreeDataService) {}

  ngOnInit(): void {
    this.flatArray = this.generateFlatArray();
  }

  /**
   * Track visibility changes for items
   */
  onVisibilityChange(event: { id: number; isVisible: boolean }): void {
    this.visibleIds[event.id] = event.isVisible;
  }

  /**
   * Toggle a parent's open/closed state
   */
  toggleParent(parentId: number): void {
    this.parentOpenState[parentId] = !this.parentOpenState[parentId];
    this.flatArray = this.generateFlatArray();
  }

  /**
   * Check if a parent is open
   */
  isParentOpen(parentId: number): boolean {
    return this.parentOpenState[parentId] ?? false;
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
