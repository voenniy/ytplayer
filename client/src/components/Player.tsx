import { useEffect } from "react";
import { usePlayerStore } from "@/stores/player";
import { useAudio } from "@/hooks/useAudio";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, Volume2 } from "lucide-react";

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Player() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const storeIsPlaying = usePlayerStore((s) => s.isPlaying);
  const storePause = usePlayerStore((s) => s.pause);
  const storeResume = usePlayerStore((s) => s.resume);
  const playNext = usePlayerStore((s) => s.playNext);

  const audio = useAudio(playNext);

  useEffect(() => {
    if (currentTrack) {
      audio.play(currentTrack.id);
    }
  }, [currentTrack?.id]);

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (storeIsPlaying) {
      audio.pause();
      storePause();
    } else {
      audio.resume();
      storeResume();
    }
  };

  return (
    <div data-testid="player" className="border-t bg-card px-4 py-3">
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-12 h-12 rounded" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(audio.currentTime)}
            </span>
            <Slider
              value={[audio.currentTime]}
              max={audio.duration || 100}
              step={1}
              onValueChange={([v]) => audio.seek(v)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(audio.duration)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePlayPause}>
            {storeIsPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={playNext}>
            <SkipForward className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1 ml-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[audio.volume * 100]}
              max={100}
              step={1}
              onValueChange={([v]) => audio.setVolume(v / 100)}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
