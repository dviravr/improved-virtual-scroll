import { Injectable } from "@angular/core";
import { Observable, of, delay, map } from "rxjs";
import { pick, pickBy, values } from "lodash";
import { TreeNode, ChildNode, ParentNode } from "../models/tree-node.interface";
import { TREE_MOCK_DATA } from "../data/tree-mock.data";

@Injectable({
  providedIn: "root",
})
export class TreeDataService {
  /**
   * Get a node by ID - returns an observable
   * Simulates async data fetching with a small delay
   */
  getNodeById(id: number): Observable<ChildNode | undefined> {
    // console.log(`🔍 Fetching node with ID: ${id}`);
    const node = this.getAllNodes()[id];

    if (node.type === "child") {
      return of(node as ChildNode).pipe(delay(10));
    } else {
      return of(undefined);
    }
  }

  /**
   * Get all nodes
   */
  getAllNodes(): Record<number, TreeNode> {
    return TREE_MOCK_DATA;
  }

  getFirstParentNodes(): ParentNode[] {
    return values(
      pickBy(
        this.getAllNodes(),
        (node: TreeNode): node is ParentNode =>
          node.type === "parent" && node.parentId === undefined
      )
    );
  }

  /**
   * Get all children of a specific node
   */
  getChildren(parent: ParentNode): TreeNode[] {
    return parent.childrenIds.map((id) => this.getAllNodes()[id]);
  }
}
