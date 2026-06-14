"use client";

import { useState } from "react";
import type { Task } from "../../types/task";
import { buildTree, flattenVisible } from "../../lib/taskTree";

interface Props {
  projectId: number;
  initialTasks: Task[];
}

export default function TaskTreeTable({ projectId, initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tree = buildTree(tasks);
  const rows = flattenVisible(tree, collapsedIds);

  const collectDescendantIds = (id: number, all: Task[]): Set<number> => {
    const ids = new Set<number>([id]);
    all
      .filter((t) => t.parent_id === id)
      .forEach((c) => {
        collectDescendantIds(c.id, all).forEach((d) => ids.add(d));
      });
    return ids;
  };

  const handleDelete = async (id: number) => {
    setErrorMessage(null);
    const res = await fetch(`/api/projects/${projectId}/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErrorMessage("削除に失敗しました。もう一度お試しください。");
      return;
    }
    const toRemove = collectDescendantIds(id, tasks);
    setTasks((prev) => prev.filter((t) => !toRemove.has(t.id)));
    if (editingId !== null && toRemove.has(editingId)) setEditingId(null);
  };

  const toggleCollapse = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());

  const collapseAll = () => {
    const parentIds = new Set<number>(
      tasks.filter((t) => t.parent_id !== null).map((t) => t.parent_id!)
    );
    setCollapsedIds(parentIds);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditingName(task.name);
  };

  const commitEdit = () => {
    setEditingId(null);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewTaskName("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsAdding(true)}
          className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          タスクを追加
        </button>
        <button onClick={expandAll} className="rounded border px-3 py-1.5 text-sm hover:bg-accent">
          全展開
        </button>
        <button
          onClick={collapseAll}
          className="rounded border px-3 py-1.5 text-sm hover:bg-accent"
        >
          全折りたたみ
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      )}

      {tasks.length === 0 && !isAdding && (
        <p className="py-8 text-center text-sm text-muted-foreground">タスクがありません</p>
      )}

      {isAdding && (
        <div className="flex items-center gap-2 rounded border bg-muted/30 px-3 py-2">
          <input
            aria-label="タスク名"
            type="text"
            autoFocus
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelAdding();
            }}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="タスク名を入力"
          />
          <button
            onClick={cancelAdding}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            キャンセル
          </button>
        </div>
      )}

      <div className="flex flex-col">
        {rows.map((row) => {
          const isCollapsed = collapsedIds.has(row.task.id);
          const isEditing = editingId === row.task.id;
          return (
            <div
              key={row.task.id}
              className="flex items-center gap-2 border-b py-2"
              style={{ paddingLeft: `${Math.min(row.depth, 4) * 24 + 8}px` }}
            >
              {row.hasChildren ? (
                <button
                  aria-label={isCollapsed ? "展開" : "折りたたむ"}
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleCollapse(row.task.id)}
                  className="flex h-6 w-6 items-center justify-center text-xs text-muted-foreground hover:text-foreground"
                >
                  {isCollapsed ? "▶" : "▼"}
                </button>
              ) : (
                <span className="h-6 w-6" />
              )}

              {isEditing ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="flex-1 rounded border bg-background px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <span
                  className="flex-1 cursor-pointer text-sm hover:text-primary"
                  onClick={() => startEdit(row.task)}
                >
                  {row.task.name}
                </span>
              )}

              <button
                aria-label={`${row.task.name} を削除`}
                onClick={() => handleDelete(row.task.id)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                削除
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
