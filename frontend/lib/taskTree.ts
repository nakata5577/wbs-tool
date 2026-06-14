import type { Task } from "../types/task";

export interface TreeNode {
  task: Task;
  children: TreeNode[];
  depth: number;
}

export interface FlatRow {
  task: Task;
  depth: number;
  hasChildren: boolean;
}

export function buildTree(tasks: Task[]): TreeNode[] {
  const nodesById = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  const sorted = [...tasks].sort((a, b) => a.sort_order - b.sort_order);

  for (const task of sorted) {
    nodesById.set(task.id, { task, children: [], depth: 0 });
  }

  for (const task of sorted) {
    const node = nodesById.get(task.id)!;
    const parent = task.parent_id === null ? undefined : nodesById.get(task.parent_id);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function assignDepth(nodes: TreeNode[], depth: number): void {
    for (const node of nodes) {
      node.depth = depth;
      assignDepth(node.children, depth + 1);
    }
  }
  assignDepth(roots, 0);

  return roots;
}

export function flattenVisible(tree: TreeNode[], collapsedIds: Set<number>): FlatRow[] {
  const rows: FlatRow[] = [];

  function traverse(nodes: TreeNode[]): void {
    for (const node of nodes) {
      rows.push({
        task: node.task,
        depth: node.depth,
        hasChildren: node.children.length > 0,
      });
      if (!collapsedIds.has(node.task.id)) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return rows;
}
