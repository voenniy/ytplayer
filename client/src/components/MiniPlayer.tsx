import { useEffect } from "react";
import { usePlayerStore } from "@/stores/player";
import { usePlaylistsStore } from "@/stores/playlists";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Pause, SkipForward, ListPlus, FolderPlus, Plus } from "lucide-react";
import { handleImgError } from "@/lib/img-fallback";

interface MiniPlayerProps {
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onTap: () => void;
}

export function MiniPlayer({
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onTap,
}: MiniPlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playlists = usePlaylistsStore((s) => s.playlists);
  const createPlaylist = usePlaylistsStore((s) => s.createPlaylist);
  const addTrackToPlaylist = usePlaylistsStore((s) => s.addTrack);
  const loadPlaylists = usePlaylistsStore((s) => s.loadPlaylists);

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="md:hidden border-t bg-card relative">
      {/* Thin progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted">
        <div
          className="h-full bg-green-500 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        onClick={onTap}
      >
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-10 h-10 rounded object-cover"
          onError={handleImgError}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artist}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(currentTrack);
          }}
          title="В очередь"
        >
          <ListPlus className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => e.stopPropagation()}
              title="В плейлист"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {playlists.map((pl) => (
              <DropdownMenuItem key={pl.id} onClick={() => addTrackToPlaylist(pl.id, currentTrack)}>
                {pl.name}
              </DropdownMenuItem>
            ))}
            {playlists.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={async () => {
              const name = prompt("Название плейлиста:");
              if (!name?.trim()) return;
              await createPlaylist(name.trim());
              const { playlists: updated } = usePlaylistsStore.getState();
              if (updated.length > 0) addTrackToPlaylist(updated[0].id, currentTrack);
            }}>
              <Plus className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-green-500">Создать новый</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
