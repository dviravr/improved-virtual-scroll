export type TreeNode = ChildNode | ParentNode;

export interface ChildNode {
  id: string;
  name: string;
  childrenIds: null;
  parentIds: string[];
  type: "child";
}

export interface ParentNode {
  id: string;
  name: string;
  childrenIds: string[];
  parentId?: string;
  type: "parent";
}
