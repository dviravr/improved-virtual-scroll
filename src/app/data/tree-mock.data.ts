import { TreeNode, ParentNode, ChildNode } from "../models/tree-node.interface";

/**
 * Generates mock tree data with 2-level hierarchy:
 * - 2 grand parents
 * - Each grand parent has 3 parents (6 total)
 * - 100 children distributed among the 6 parents
 */
function generateTreeMockData(): Record<number, TreeNode> {
  const treeData: Record<number, TreeNode> = {};

  // Create 2 grand parent nodes (IDs: 1, 2)
  const grandParentIds = [1, 2];
  grandParentIds.forEach((id) => {
    treeData[id] = <ParentNode>{
      id,
      name: `Grand Parent ${id}`,
      childrenIds: [],
      type: "parent",
    };
  });

  // Create 6 parent nodes (IDs: 3-8), 3 for each grand parent
  grandParentIds.forEach((grandParentId, gpIndex) => {
    let parentId = grandParentId * 10;

    for (let i = 1; i <= 3; i++) {
      treeData[parentId] = <ParentNode>{
        id: parentId,
        name: `Parent ${gpIndex + 1}.${i}`,
        childrenIds: [],
        parentId: grandParentId,
        type: "parent",
      };

      // Add this parent to grand parent's children
      (treeData[grandParentId] as ParentNode).childrenIds.push(parentId);
      parentId++;
    }
  });

  const allParentIds = [10, 11, 12, 20, 21, 22];

  // Create 100 child nodes (IDs 9-108)
  for (let id = 100; id <= 200; id++) {
    const childIndex = id - 99;

    // Randomly assign 1-3 parents to each child
    const numParents = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 parents
    const assignedParents: number[] = [];

    // Shuffle parent IDs and take the first numParents
    const shuffledParents = [...allParentIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numParents; i++) {
      assignedParents.push(shuffledParents[i]);
    }

    // Sort parent IDs for consistency
    assignedParents.sort((a, b) => a - b);

    // Create child node
    treeData[id] = <ChildNode>{
      id,
      name: `Child ${childIndex}`,
      childrenIds: null,
      parentIds: assignedParents,
      type: "child",
    };

    // Update parent nodes with this child
    assignedParents.forEach((parentId) => {
      (treeData[parentId] as ParentNode).childrenIds.push(id);
    });
  }

  return treeData;
}

// Export the generated mock data
export const TREE_MOCK_DATA: Record<number, TreeNode> = generateTreeMockData();
