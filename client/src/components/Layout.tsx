import type { ReactNode } from "react";
import { Player } from "./Player";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-bold">MusicPlay</h1>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      <Player />
    </div>
  );
}
