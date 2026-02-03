import { useState, useEffect } from "react";
import { usePlaylistsStore } from "@/stores/playlists";
import { usePlayerStore } from "@/stores/player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Play, ChevronRight, ListMusic, Trash2 } from "lucide-react";

interface PlaylistListProps {
  onOpenPlaylist: (id: number) => void;
}

export function PlaylistList({ onOpenPlaylist }: PlaylistListProps) {
  const [newName, setNewName] = useState("");
  const playlists = usePlaylistsStore((s) => s.playlists);
  const loadPlaylists = usePlaylistsStore((s) => s.loadPlaylists);
  const createPlaylist = usePlaylistsStore((s) => s.createPlaylist);
  const deletePlaylist = usePlaylistsStore((s) => s.deletePlaylist);
  const selectPlaylist = usePlaylistsStore((s) => s.selectPlaylist);
  const play = usePlayerStore((s) => s.play);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createPlaylist(trimmed);
    setNewName("");
  };

  const handlePlay = async (id: number) => {
    await selectPlaylist(id);
    const { activePlaylistTracks } = usePlaylistsStore.getState();
    if (activePlaylistTracks.length === 0) return;
    clearQueue();
    activePlaylistTracks.slice(1).forEach((t) => addToQueue(t));
    play(activePlaylistTracks[0]);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Новый плейлист..."
          className="flex-1"
        />
        <Button size="icon" onClick={handleCreate} className="bg-green-500 hover:bg-green-600 text-black shrink-0">
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-1">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted group cursor-pointer"
            onClick={() => onOpenPlaylist(pl.id)}
          >
            <ListMusic className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{pl.name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); handlePlay(pl.id); }}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        ))}
        {playlists.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Нет плейлистов</p>
        )}
      </div>
    </div>
  );
}
