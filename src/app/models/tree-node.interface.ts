export type TreeNode = ChildNode | ParentNode;

export interface ChildNode {
  id: number;
  name: string;
  childrenIds: null;
  parentIds: number[];
  type: "child";
}

export interface ParentNode {
  id: number;
  name: string;
  childrenIds: number[];
  parentId?: number;
  type: "parent";
}
