import { usePlayerStore } from "@/stores/player";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Repeat1 } from "lucide-react";
import { VisuallyHidden } from "radix-ui";
const VisuallyHiddenRoot = VisuallyHidden.Root;

interface FullscreenPlayerProps {
  open: boolean;
  onClose: () => void;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
}

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FullscreenPlayer({
  open,
  onClose,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
}: FullscreenPlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);

  if (!currentTrack) return null;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="!h-[100dvh] !max-h-[100dvh] !rounded-none !border-0 !mt-0">
        <VisuallyHiddenRoot>
          <DrawerTitle>Плеер</DrawerTitle>
        </VisuallyHiddenRoot>

        <div className="flex flex-col h-full px-6 pb-8">
          {/* Header with close button */}
          <div className="flex items-center justify-center py-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0"
              onClick={onClose}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Сейчас играет
            </span>
          </div>

          {/* Album cover */}
          <div className="flex-1 flex items-center justify-center py-4">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-72 h-72 rounded-lg object-cover shadow-2xl"
            />
          </div>

          {/* Track info */}
          <div className="mb-6">
            <p className="text-lg font-semibold truncate">
              {currentTrack.title}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {currentTrack.artist}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={([v]) => onSeek(v)}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <Button variant="ghost" size="icon" className="h-12 w-12" onClick={onPrev}>
              <SkipBack className="h-6 w-6" />
            </Button>
            <button
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-colors"
              onClick={onPlayPause}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 text-black" />
              ) : (
                <Play className="h-7 w-7 text-black ml-1" />
              )}
            </button>
            <Button variant="ghost" size="icon" className="h-12 w-12" onClick={onNext}>
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex justify-center">
            <Button variant="ghost" size="icon" onClick={toggleRepeat}>
              <Repeat1 className={`h-5 w-5 ${repeatMode === "one" ? "text-green-500" : ""}`} />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
