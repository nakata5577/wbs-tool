import PageShell from "@/components/layout/PageShell";
import TaskTreeTable from "@/components/wbs/TaskTreeTable";
import type { Task } from "@/types/task";
import Link from "next/link";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function getTasks(projectId: string): Promise<Task[]> {
  const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/tasks`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("タスク一覧の取得に失敗しました");
  return res.json();
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WbsPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  const tasks = await getTasks(id);

  return (
    <PageShell>
      <header className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← プロジェクト一覧
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">WBS</h1>
      </header>
      <TaskTreeTable projectId={Number(id)} initialTasks={tasks} />
    </PageShell>
  );
}
