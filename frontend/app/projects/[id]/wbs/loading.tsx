import PageShell from "@/components/layout/PageShell";

export default function WbsLoading(): React.JSX.Element {
  return (
    <PageShell>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
