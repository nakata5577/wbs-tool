"use client";

import PageShell from "@/components/layout/PageShell";

interface Props {
  error: Error;
  reset: () => void;
}

export default function WbsError({ error, reset }: Props): React.JSX.Element {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-destructive">{error.message}</p>
        <button
          onClick={reset}
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          再試行
        </button>
      </div>
    </PageShell>
  );
}
