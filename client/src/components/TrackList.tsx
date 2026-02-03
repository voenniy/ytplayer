import { useState, useMemo } from "react";
import type { Track } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Eye, ThumbsUp, ListPlus, Clock, ArrowUpDown } from "lucide-react";

interface TrackListProps {
  tracks: Track[];
  onPlay: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

type SortField = "default" | "duration" | "viewCount" | "likeCount";

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const sortOptions: { field: SortField; label: string; icon: typeof Clock }[] = [
  { field: "duration", label: "Длительность", icon: Clock },
  { field: "viewCount", label: "Просмотры", icon: Eye },
  { field: "likeCount", label: "Лайки", icon: ThumbsUp },
];

export function TrackList({ tracks, onPlay, onAddToQueue }: TrackListProps) {
  const [sortField, setSortField] = useState<SortField>("default");
  const [sortAsc, setSortAsc] = useState(false);

  const sortedTracks = useMemo(() => {
    if (sortField === "default") return tracks;
    return [...tracks].sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortAsc ? diff : -diff;
    });
  }, [tracks, sortField, sortAsc]);

  if (tracks.length === 0) return null;

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant={sortField === "default" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs px-2.5"
          onClick={() => { setSortField("default"); setSortAsc(false); }}
        >
          <ArrowUpDown className="h-3 w-3 mr-1" />
          YouTube
        </Button>
        {sortOptions.map(({ field, label, icon: Icon }) => (
          <Button
            key={field}
            variant={sortField === field ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => handleSortClick(field)}
          >
            <Icon className="h-3 w-3 mr-1" />
            {label}
            {sortField === field && (
              <span className="ml-0.5">{sortAsc ? "↑" : "↓"}</span>
            )}
          </Button>
        ))}
      </div>
      <div className="space-y-1">
        {sortedTracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer group"
            onClick={() => onPlay(track)}
          >
            <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{track.title}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="truncate">{track.artist}</span>
                {track.viewCount > 0 && (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <Eye className="h-3 w-3" />
                    {formatCount(track.viewCount)}
                  </span>
                )}
                {track.likeCount > 0 && (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <ThumbsUp className="h-3 w-3" />
                    {formatCount(track.likeCount)}
                  </span>
                )}
              </div>
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
    </div>
  );
}
