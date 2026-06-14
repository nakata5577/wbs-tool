"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { Task } from "../../types/task";

interface Props {
  task: Task;
  open: boolean;
  onClose: () => void;
  onSave: (updated: Task) => void;
}

const STATUS_OPTIONS = ["未着手", "進行中", "完了", "保留"] as const;

const LABEL_CLASS = "text-sm font-medium text-foreground";
// 操作要素の共通スタイル。{bg} で背景色だけ差し替える（input=transparent / select=background）
const controlClass = (bg: string) =>
  `h-8 rounded-lg border border-input ${bg} px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50`;
const INPUT_CLASS = controlClass("bg-transparent");
const SELECT_CLASS = controlClass("bg-background");

// querySelectorAll でフォーカストラップ対象（無効化されていない操作要素）を集める
const FOCUSABLE_SELECTOR =
  "button:not([disabled]), input:not([disabled]), select:not([disabled])";

interface FieldProps {
  htmlFor: string;
  label: ReactNode;
  children: ReactNode;
}

// ラベルと操作要素を縦並びにする共通レイアウト（label の htmlFor と control の id は呼び出し側で対応させる）
function Field({ htmlFor, label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function TaskDetailPanel({ task, open, onClose, onSave }: Props) {
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [startDate, setStartDate] = useState(task.start_date ?? "");
  const [endDate, setEndDate] = useState(task.end_date ?? "");
  const [progress, setProgress] = useState(task.progress);
  const [status, setStatus] = useState(task.status);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLInputElement>(null);

  // パネルが開いたとき最初のフォーカス対象へ移動
  useEffect(() => {
    if (open) firstFocusRef.current?.focus();
  }, [open]);

  // ESC キーでパネルを閉じる
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // フォーカストラップ: Tab キーをパネル内に閉じ込める
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    setError(null);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignee: assignee || null,
        start_date: startDate || null,
        end_date: endDate || null,
        progress,
        status,
      }),
    });
    if (!res.ok) {
      setError("保存に失敗しました。もう一度お試しください。");
      return;
    }
    const updated: Task = await res.json();
    onSave(updated);
  };

  return (
    <>
      {/* モバイル幅ではバックドロップを表示して背後の操作を防ぐ */}
      <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l bg-background shadow-xl sm:w-96"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id="task-detail-title" className="text-base font-medium text-foreground">タスク詳細</h2>
          <button
            aria-label="閉じる"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            ×
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mx-6 mt-4 rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          <Field htmlFor="panel-assignee" label="担当者">
            <input
              ref={firstFocusRef}
              id="panel-assignee"
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>

          <Field htmlFor="panel-start-date" label="開始日">
            <input
              id="panel-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>

          <Field htmlFor="panel-end-date" label="終了日">
            <input
              id="panel-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>

          <Field htmlFor="panel-progress" label={`進捗率 ${progress}%`}>
            <input
              id="panel-progress"
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Field>

          <Field htmlFor="panel-status" label="ステータス">
            <select
              id="panel-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={SELECT_CLASS}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-2 border-t px-6 py-4">
          <button
            onClick={handleSave}
            className="flex h-8 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            保存
          </button>
          <button
            onClick={onClose}
            className="flex h-8 flex-1 items-center justify-center rounded-lg border px-4 text-sm hover:bg-accent"
          >
            キャンセル
          </button>
        </div>
      </div>
    </>
  );
}
