"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Task } from "../../types/task";
import type { FlatRow } from "../../lib/taskTree";
import { buildTree, flattenVisible, reorderTasks } from "../../lib/taskTree";

interface Props {
  projectId: number;
  initialTasks: Task[];
}

// 指定タスクとその全子孫の id を集める（削除時に子孫もまとめて取り除くため）
function collectDescendantIds(id: number, tasks: Task[]): Set<number> {
  const ids = new Set<number>([id]);
  for (const child of tasks.filter((t) => t.parent_id === id)) {
    for (const descendantId of collectDescendantIds(child.id, tasks)) {
      ids.add(descendantId);
    }
  }
  return ids;
}

interface DropZoneProps {
  id: string;
  zone: "before" | "after" | "child";
  taskId: number;
  className: string;
  active: boolean;
}

function DropZone({ id, zone, taskId, className, active }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { zone, taskId } });
  return (
    <div
      ref={setNodeRef}
      className={`${className} ${active ? "" : "pointer-events-none"} ${isOver ? "bg-primary/15 ring-1 ring-inset ring-primary/50" : ""}`}
    />
  );
}

interface DraggableTaskRowProps {
  row: FlatRow;
  isCollapsed: boolean;
  isEditing: boolean;
  editingName: string;
  isGlobalDragging: boolean;
  onToggleCollapse: (id: number) => void;
  onStartEdit: (task: Task) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onEditingNameChange: (name: string) => void;
  onDelete: (id: number) => void;
}

function DraggableTaskRow({
  row,
  isCollapsed,
  isEditing,
  editingName,
  isGlobalDragging,
  onToggleCollapse,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onEditingNameChange,
  onDelete,
}: DraggableTaskRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: row.task.id,
  });

  return (
    <div
      ref={setNodeRef}
      data-testid="task-row"
      className={`relative flex items-center gap-2 border-b py-2 ${isDragging ? "opacity-50" : ""}`}
      style={{ paddingLeft: `${Math.min(row.depth, 4) * 24 + 8}px` }}
    >
      {/* ドロップゾーン: 上 33% = before、中 33% = after、下 33% = child */}
      <DropZone
        id={`before-${row.task.id}`}
        zone="before"
        taskId={row.task.id}
        className="absolute inset-x-0 top-0 z-10 h-1/3 rounded-t"
        active={isGlobalDragging}
      />
      <DropZone
        id={`after-${row.task.id}`}
        zone="after"
        taskId={row.task.id}
        className="absolute inset-x-0 top-1/3 z-10 h-1/3"
        active={isGlobalDragging}
      />
      <DropZone
        id={`child-${row.task.id}`}
        zone="child"
        taskId={row.task.id}
        className="absolute inset-x-0 bottom-0 z-10 h-1/3 rounded-b"
        active={isGlobalDragging}
      />

      {/* ドラッグハンドル */}
      <button
        {...attributes}
        {...listeners}
        className="flex h-6 w-6 cursor-grab items-center justify-center text-xs text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="ドラッグして並べ替え"
      >
        ⠿
      </button>

      {row.hasChildren ? (
        <button
          aria-label={isCollapsed ? "展開" : "折りたたむ"}
          aria-expanded={!isCollapsed}
          onClick={() => onToggleCollapse(row.task.id)}
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
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitEdit();
            if (e.key === "Escape") onCancelEdit();
          }}
          autoFocus
          className="flex-1 rounded border bg-background px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
      ) : (
        <span
          className="flex-1 cursor-pointer text-sm hover:text-primary"
          onClick={() => onStartEdit(row.task)}
        >
          {row.task.name}
        </span>
      )}

      <button
        aria-label={`${row.task.name} を削除`}
        onClick={() => onDelete(row.task.id)}
        className="text-xs text-muted-foreground hover:text-destructive"
      >
        削除
      </button>
    </div>
  );
}

export default function TaskTreeTable({ projectId, initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const tree = buildTree(tasks);
  const rows = flattenVisible(tree, collapsedIds);

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsGlobalDragging(false);
    const { active, over } = event;
    if (!over) return;

    const dragId = Number(active.id);
    const data = over.data.current as { zone?: "before" | "after" | "child"; taskId?: number } | undefined;
    const zone = data?.zone;
    const dropId = data?.taskId;

    if (!zone || dropId === undefined || dragId === dropId) return;

    setErrorMessage(null);
    const previousTasks = tasks;
    const reordered = reorderTasks(tasks, dragId, dropId, zone);
    const movedTask = reordered.find((t) => t.id === dragId);
    if (!movedTask) return;

    setTasks(reordered);

    const res = await fetch(`/api/tasks/${dragId}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort_order: movedTask.sort_order, parent_id: movedTask.parent_id }),
    });

    if (!res.ok) {
      setTasks(previousTasks);
      setErrorMessage("移動に失敗しました。もう一度お試しください。");
      return;
    }

    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDelete = async (id: number) => {
    setErrorMessage(null);
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
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
      tasks.filter((t) => t.parent_id !== null).map((t) => t.parent_id!),
    );
    setCollapsedIds(parentIds);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditingName(task.name);
  };

  const commitEdit = async () => {
    if (editingId === null) return;
    const trimmed = editingName.trim();
    const original = tasks.find((t) => t.id === editingId);
    if (!trimmed || (original && trimmed === original.name)) {
      setEditingId(null);
      return;
    }
    const res = await fetch(`/api/tasks/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) {
      setErrorMessage("更新に失敗しました。もう一度お試しください。");
      setEditingId(null);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, name: trimmed } : t)));
    setEditingId(null);
  };

  const handleAddTask = async () => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) {
      setErrorMessage("追加に失敗しました。もう一度お試しください。");
      return;
    }
    const task: Task = await res.json();
    setTasks((prev) => [...prev, task]);
    cancelAdding();
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
              if (e.key === "Enter") handleAddTask();
              if (e.key === "Escape") cancelAdding();
            }}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="タスク名を入力"
          />
          <button onClick={handleAddTask} className="text-xs text-primary hover:text-primary/80">
            追加
          </button>
          <button
            onClick={cancelAdding}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            キャンセル
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={() => setIsGlobalDragging(true)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setIsGlobalDragging(false)}
      >
        <div className="flex flex-col">
          {rows.map((row) => (
            <DraggableTaskRow
              key={row.task.id}
              row={row}
              isCollapsed={collapsedIds.has(row.task.id)}
              isEditing={editingId === row.task.id}
              editingName={editingName}
              isGlobalDragging={isGlobalDragging}
              onToggleCollapse={toggleCollapse}
              onStartEdit={startEdit}
              onCommitEdit={commitEdit}
              onCancelEdit={() => setEditingId(null)}
              onEditingNameChange={setEditingName}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
