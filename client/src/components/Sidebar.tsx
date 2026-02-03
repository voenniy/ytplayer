import { useEffect, useState } from "react";
import { usePlaylistsStore } from "@/stores/playlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Music } from "lucide-react";

export function Sidebar() {
  const { playlists, activePlaylistId, loadPlaylists, createPlaylist, deletePlaylist, selectPlaylist } =
    usePlaylistsStore();
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName("");
    }
  };

  return (
    <aside className="w-60 border-r flex flex-col">
      <div className="p-3 border-b">
        <h2 className="text-sm font-semibold mb-2">Плейлисты</h2>
        <div className="flex gap-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Новый плейлист..."
            className="text-xs h-8"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <button
            className={`w-full text-left text-sm px-2 py-1.5 rounded ${
              activePlaylistId === null ? "bg-muted" : "hover:bg-muted"
            }`}
            onClick={() => selectPlaylist(null)}
          >
            <Music className="h-4 w-4 inline mr-2" />
            Поиск
          </button>
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm cursor-pointer ${
                activePlaylistId === pl.id ? "bg-muted" : "hover:bg-muted"
              }`}
              onClick={() => selectPlaylist(pl.id)}
            >
              <span className="flex-1 truncate">{pl.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlaylist(pl.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
