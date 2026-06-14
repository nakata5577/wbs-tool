import PageShell from "@/components/layout/PageShell";
import { PROJECT_GRID_CLASS } from "@/components/project/layout";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_CARD_COUNT = 3;

export default function Loading(): React.JSX.Element {
  return (
    <PageShell>
      <header className="mb-8">
        <Skeleton className="h-8 w-48" />
      </header>
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className={PROJECT_GRID_CLASS}>
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border p-5 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </PageShell>
  );
}
