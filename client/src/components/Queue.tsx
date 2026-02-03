import { usePlayerStore } from "@/stores/player";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Shuffle, Trash2 } from "lucide-react";

export function Queue() {
  const queue = usePlayerStore((s) => s.queue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const play = usePlayerStore((s) => s.play);

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
          {queue.map((track, index) => (
            <div
              key={`${track.id}-${index}`}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer group"
              onClick={() => play(track)}
            >
              <img src={track.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
              </div>
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
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
