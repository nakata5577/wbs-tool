"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/project/ProjectCard";
import CreateProjectModal from "@/components/project/CreateProjectModal";
import { PROJECT_GRID_CLASS } from "@/components/project/layout";
import type { Project } from "@/types/project";

interface Props {
  initialProjects: Project[];
}

function matchesQuery(project: Project, query: string): boolean {
  const haystack = `${project.name} ${project.description ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function ProjectList({ initialProjects }: Props): React.JSX.Element {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = projects.filter((project) => matchesQuery(project, query));

  const handleCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="プロジェクトを検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="プロジェクトを検索"
          />
        </div>
        <Button onClick={() => setModalOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          新規プロジェクト
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {query ? "検索結果がありません" : "プロジェクトがありません"}
          </p>
          {!query && (
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
              最初のプロジェクトを作成する
            </Button>
          )}
        </div>
      ) : (
        <div className={PROJECT_GRID_CLASS}>
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
}
