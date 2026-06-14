"use client";

import PageShell from "@/components/layout/PageShell";

interface Props {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: Props): React.JSX.Element {
  return (
    <PageShell>
      <div
        role="alert"
        className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
      >
        <p className="text-sm text-destructive font-medium">プロジェクト一覧の取得に失敗しました</p>
        <p className="text-xs text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          再試行
        </button>
      </div>
    </PageShell>
  );
}
