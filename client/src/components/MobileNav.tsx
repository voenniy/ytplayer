import { Search, ListMusic, ListOrdered } from "lucide-react";

export type MobileTab = "search" | "playlists" | "queue";

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const tabs: { id: MobileTab; label: string; icon: typeof Search }[] = [
  { id: "search", label: "Поиск", icon: Search },
  { id: "playlists", label: "Плейлисты", icon: ListMusic },
  { id: "queue", label: "Очередь", icon: ListOrdered },
];

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="md:hidden border-t bg-card flex">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
            activeTab === id
              ? "text-green-500"
              : "text-muted-foreground"
          }`}
          onClick={() => onTabChange(id)}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </nav>
  );
}
