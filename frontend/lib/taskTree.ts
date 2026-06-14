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

export function reorderTasks(
  tasks: Task[],
  dragId: number,
  dropId: number,
  zone: "before" | "after" | "child",
): Task[] {
  if (zone === "child") {
    const maxChildSort = tasks
      .filter((t) => t.parent_id === dropId)
      .reduce((max, t) => Math.max(max, t.sort_order), -1);
    return tasks
      .map((t) => (t.id === dragId ? { ...t, parent_id: dropId, sort_order: maxChildSort + 1 } : t))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const dropTask = tasks.find((t) => t.id === dropId)!;
  const newParentId = dropTask.parent_id;

  const siblings = tasks
    .filter((t) => t.parent_id === newParentId && t.id !== dragId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const dropIdx = siblings.findIndex((t) => t.id === dropId);
  const insertIdx = zone === "before" ? dropIdx : dropIdx + 1;

  const dragTask = tasks.find((t) => t.id === dragId)!;
  const reordered = [...siblings];
  reordered.splice(insertIdx, 0, { ...dragTask, parent_id: newParentId });

  const updatedSiblings = reordered.map((t, i) => ({ ...t, sort_order: i }));
  const siblingIds = new Set(updatedSiblings.map((t) => t.id));

  return tasks
    .map((t) => (siblingIds.has(t.id) ? updatedSiblings.find((s) => s.id === t.id)! : t))
    .sort((a, b) => a.sort_order - b.sort_order);
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
