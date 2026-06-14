"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

const NAME_REQUIRED_MESSAGE = "プロジェクト名を入力してください";
const CREATE_FAILED_MESSAGE = "作成に失敗しました。再度お試しください。";

export default function CreateProjectModal({ open, onClose, onSuccess }: Props): React.JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setName("");
    setDescription("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e?: { preventDefault(): void }) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError(NAME_REQUIRED_MESSAGE);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(CREATE_FAILED_MESSAGE);
      const project: Project = await res.json();
      onSuccess(project);
      handleClose();
    } catch {
      setError(CREATE_FAILED_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規プロジェクト作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {error && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">
              プロジェクト名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="プロジェクト名を入力"
              aria-required="true"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description">説明（任意）</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="プロジェクトの説明を入力（任意）"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
