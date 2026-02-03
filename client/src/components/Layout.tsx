import type { ReactNode } from "react";
import { Queue } from "./Queue";

interface LayoutProps {
  children: ReactNode;
  desktopPlayer?: ReactNode;
  mobileBottom?: ReactNode;
}

export function Layout({ children, desktopPlayer, mobileBottom }: LayoutProps) {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-4 py-3 shrink-0">
        <h1 className="text-xl font-bold">MusicPlay</h1>
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</main>
        <div className="hidden md:flex">
          <Queue />
        </div>
      </div>
      {/* Desktop player */}
      <div className="hidden md:block shrink-0">
        {desktopPlayer}
      </div>
      {/* Mobile: MiniPlayer + MobileNav */}
      {mobileBottom}
    </div>
  );
}
