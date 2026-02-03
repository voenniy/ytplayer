import type { Track } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ListPlus } from "lucide-react";

interface TrackListProps {
  tracks: Track[];
  onPlay: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackList({ tracks, onPlay, onAddToQueue }: TrackListProps) {
  if (tracks.length === 0) return null;

  return (
    <div className="space-y-1">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer group"
          onClick={() => onPlay(track)}
        >
          <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          </div>
          <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onAddToQueue(track); }}
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
