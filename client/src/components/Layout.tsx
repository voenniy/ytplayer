import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Player } from "./Player";
import { Queue } from "./Queue";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-bold">MusicPlay</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        <Queue />
      </div>
      <Player />
    </div>
  );
}
