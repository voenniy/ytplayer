import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Queue } from "./Queue";

interface LayoutProps {
  children: ReactNode;
  desktopPlayer?: ReactNode;
  mobileBottom?: ReactNode;
}

export function Layout({ children, desktopPlayer, mobileBottom }: LayoutProps) {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-bold">MusicPlay</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        <div className="hidden md:flex">
          <Queue />
        </div>
      </div>
      {/* Desktop player */}
      <div className="hidden md:block">
        {desktopPlayer}
      </div>
      {/* Mobile: MiniPlayer + MobileNav */}
      {mobileBottom}
    </div>
  );
}
