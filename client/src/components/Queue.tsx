import { usePlayerStore } from "@/stores/player";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Shuffle, Trash2, Volume2, Pause, ExternalLink } from "lucide-react";

export function Queue() {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const playFromQueue = usePlayerStore((s) => s.playFromQueue);

  return (
    <aside className="w-full md:w-64 md:border-l flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold">Очередь ({queue.length})</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={shuffle} disabled={queue.length < 2}>
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearQueue} disabled={queue.length === 0}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {queue.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">Очередь пуста</p>
          )}
          {queue.map((track, index) => {
            const isCurrent = index === currentIndex;
            return (
              <div
                key={`${track.id}-${index}`}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer group ${
                  isCurrent
                    ? "bg-accent border-l-2 border-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => playFromQueue(index)}
              >
                {isCurrent ? (
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10">
                    {isPlaying ? (
                      <Volume2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Pause className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ) : (
                  <img src={track.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${isCurrent ? "text-primary" : ""}`}>{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${track.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                  title="YouTube"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(index);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
