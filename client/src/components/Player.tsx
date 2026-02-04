import { usePlayerStore } from "@/stores/player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, Volume2, Repeat1 } from "lucide-react";
import { handleImgError } from "@/lib/img-fallback";

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface PlayerProps {
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
}

export function Player({
  currentTime,
  duration,
  volume,
  onPlayPause,
  onNext,
  onSeek,
  onVolumeChange,
}: PlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const storeIsPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);

  if (!currentTrack) return null;

  return (
    <div data-testid="player" className="border-t bg-card px-4 py-3">
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-12 h-12 rounded" onError={handleImgError} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={([v]) => onSeek(v)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onPlayPause}>
            {storeIsPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext}>
            <SkipForward className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleRepeat}>
            <Repeat1 className={`h-5 w-5 ${repeatMode === "one" ? "text-green-500" : ""}`} />
          </Button>
          <div className="flex items-center gap-1 ml-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={([v]) => onVolumeChange(v / 100)}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
