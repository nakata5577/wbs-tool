import Link from "next/link";
import type { Project } from "@/types/project";

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-card-foreground leading-snug line-clamp-2">
        {project.name}
      </h2>
      {project.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {project.description}
        </p>
      )}
      <Link
        href={`/projects/${project.id}/wbs`}
        className="mt-1 text-xs font-medium text-primary hover:underline"
      >
        WBS を開く →
      </Link>
    </div>
  );
}
