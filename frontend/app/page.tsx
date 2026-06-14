import PageShell from "@/components/layout/PageShell";
import ProjectList from "@/components/project/ProjectList";
import type { Project } from "@/types/project";

async function getProjects(): Promise<Project[]> {
  const res = await fetch("http://localhost:8000/api/projects", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("プロジェクト一覧の取得に失敗しました");
  return res.json();
}

export default async function Home(): Promise<React.JSX.Element> {
  const projects = await getProjects();

  return (
    <PageShell>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">プロジェクト一覧</h1>
      </header>
      <ProjectList initialProjects={projects} />
    </PageShell>
  );
}
