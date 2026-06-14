import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function PageShell({ children }: Props): React.JSX.Element {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
    </main>
  );
}
