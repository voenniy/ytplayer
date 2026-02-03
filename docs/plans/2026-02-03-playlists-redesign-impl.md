# Плейлисты: редизайн — план имплементации

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Убрать Sidebar, перенести плейлисты в табы основного контента (Поиск | Плейлисты). Добавить DropdownMenu на треках, reorder в плейлисте, запуск плейлиста.

**Architecture:** Layout становится двухколоночным (MainContent | Queue). MainContent содержит два таба — SearchView и PlaylistsView. PlaylistsView имеет два подсостояния: PlaylistList и PlaylistDetail. TrackList получает DropdownMenu вместо кнопки ListPlus.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS 4, shadcn/ui (dropdown-menu), lucide-react

**Дизайн-макеты:** `design/main-layout.pen` — экраны Desktop Search Tab, Playlists Tab, Playlist Detail, Track Dropdown Menu

---

### Task 1: Установить shadcn dropdown-menu

**Step 1:** Установить компонент

```bash
cd client && npx shadcn@latest add dropdown-menu
```

**Step 2:** Убедиться что файл создан

```bash
ls client/src/components/ui/dropdown-menu.tsx
```

**Step 3:** Коммит

```bash
git add client/src/components/ui/dropdown-menu.tsx client/package.json client/package-lock.json
git commit -m "chore: add shadcn dropdown-menu component"
```

---

### Task 2: Серверный эндпоинт reorder треков

**Files:**
- Modify: `server/src/routes/playlists.ts`
- Modify: `client/src/lib/playlist-api.ts`
- Modify: `client/src/stores/playlists.ts`

**Step 1:** Добавить PUT-эндпоинт для reorder в `server/src/routes/playlists.ts` (перед export):

```typescript
// PUT /api/playlists/:id/tracks/reorder
router.put("/:id/tracks/reorder", (req, res) => {
  const { trackIds } = req.body;
  if (!Array.isArray(trackIds)) {
    return res.status(400).json({ error: "trackIds array is required" });
  }

  const db = getDb();
  const update = db.prepare("UPDATE playlist_tracks SET position = ? WHERE id = ? AND playlist_id = ?");
  const reorder = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      update.run(index, id, req.params.id);
    });
  });
  reorder(trackIds);
  res.status(200).json({ ok: true });
});
```

**Step 2:** Добавить API-функцию в `client/src/lib/playlist-api.ts`:

```typescript
export async function reorderPlaylistTracks(playlistId: number, trackIds: number[]): Promise<void> {
  await fetch(`${API_BASE}/playlists/${playlistId}/tracks/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackIds }),
  });
}
```

**Step 3:** Добавить action `reorderTracks` в `client/src/stores/playlists.ts`:

В интерфейс `PlaylistsState` добавить:
```typescript
reorderTracks: (playlistId: number, trackIds: number[]) => Promise<void>;
```

В store добавить:
```typescript
reorderTracks: async (playlistId, trackIds) => {
  try {
    await api.reorderPlaylistTracks(playlistId, trackIds);
    const { activePlaylistId } = get();
    if (activePlaylistId === playlistId) {
      await get().selectPlaylist(playlistId);
    }
  } catch (err) {
    console.error("Failed to reorder tracks:", err);
  }
},
```

**Step 4:** Проверить `npx tsc --noEmit` в `client/`

**Step 5:** Коммит

```bash
git add server/src/routes/playlists.ts client/src/lib/playlist-api.ts client/src/stores/playlists.ts
git commit -m "feat: add reorder endpoint for playlist tracks"
```

---

### Task 3: Компонент PlaylistList

**Files:**
- Create: `client/src/components/PlaylistList.tsx`

**Step 1:** Создать `client/src/components/PlaylistList.tsx`:

```tsx
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
```

**Step 2:** Проверить `npx tsc --noEmit` в `client/`

**Step 3:** Коммит

```bash
git add client/src/components/PlaylistList.tsx
git commit -m "feat: add PlaylistList component"
```

---

### Task 4: Компонент PlaylistDetail

**Files:**
- Create: `client/src/components/PlaylistDetail.tsx`

**Step 1:** Создать `client/src/components/PlaylistDetail.tsx`:

```tsx
import { useEffect, useCallback } from "react";
import { usePlaylistsStore } from "@/stores/playlists";
import { usePlayerStore } from "@/stores/player";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, GripVertical, X } from "lucide-react";
import type { Track } from "@/lib/api";

interface PlaylistDetailProps {
  playlistId: number;
  onBack: () => void;
}

export function PlaylistDetail({ playlistId, onBack }: PlaylistDetailProps) {
  const playlists = usePlaylistsStore((s) => s.playlists);
  const tracks = usePlaylistsStore((s) => s.activePlaylistTracks);
  const selectPlaylist = usePlaylistsStore((s) => s.selectPlaylist);
  const removeTrack = usePlaylistsStore((s) => s.removeTrack);
  const reorderTracks = usePlaylistsStore((s) => s.reorderTracks);
  const play = usePlayerStore((s) => s.play);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const playlist = playlists.find((p) => p.id === playlistId);

  useEffect(() => {
    selectPlaylist(playlistId);
  }, [playlistId, selectPlaylist]);

  const handlePlayAll = useCallback(() => {
    if (tracks.length === 0) return;
    clearQueue();
    tracks.slice(1).forEach((t) => addToQueue(t));
    play(tracks[0]);
  }, [tracks, clearQueue, addToQueue, play]);

  const handleRemove = async (track: Track & { _rowId?: number }) => {
    if (track._rowId) {
      await removeTrack(playlistId, track._rowId);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData("text/plain"));
    if (sourceIndex === targetIndex) return;

    const newTracks = [...tracks];
    const [moved] = newTracks.splice(sourceIndex, 1);
    newTracks.splice(targetIndex, 0, moved);

    const trackIds = newTracks.map((t: any) => t._rowId).filter(Boolean);
    if (trackIds.length > 0) {
      await reorderTracks(playlistId, trackIds as number[]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold truncate">{playlist?.name ?? "Плейлист"}</h2>
        <span className="text-sm text-muted-foreground shrink-0">
          {tracks.length} {tracks.length === 1 ? "трек" : "треков"}
        </span>
        <div className="flex-1" />
        <Button onClick={handlePlayAll} size="sm" className="bg-green-500 hover:bg-green-600 text-black shrink-0">
          <Play className="h-4 w-4 mr-1" /> Воспроизвести всё
        </Button>
      </div>
      <div className="space-y-0.5">
        {tracks.map((track, index) => (
          <div
            key={(track as any)._rowId ?? track.id}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted group"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
            <img src={track.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
            <div className="flex-1 min-w-0" onClick={() => play(track)}>
              <p className="text-sm font-medium truncate cursor-pointer">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
              onClick={() => handleRemove(track)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {tracks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Плейлист пуст</p>
        )}
      </div>
    </div>
  );
}
```

**Step 2:** Проверить `npx tsc --noEmit` в `client/`

**Step 3:** Коммит

```bash
git add client/src/components/PlaylistDetail.tsx
git commit -m "feat: add PlaylistDetail component with drag reorder"
```

---

### Task 5: Компонент MainContent (табы Поиск/Плейлисты)

**Files:**
- Create: `client/src/components/MainContent.tsx`

**Step 1:** Создать `client/src/components/MainContent.tsx`:

```tsx
import { useState } from "react";
import { PlaylistList } from "@/components/PlaylistList";
import { PlaylistDetail } from "@/components/PlaylistDetail";
import { Search, ListMusic } from "lucide-react";

type Tab = "search" | "playlists";

interface MainContentProps {
  searchContent: React.ReactNode;
}

export function MainContent({ searchContent }: MainContentProps) {
  const [tab, setTab] = useState<Tab>("search");
  const [openPlaylistId, setOpenPlaylistId] = useState<number | null>(null);

  const renderPlaylistsContent = () => {
    if (openPlaylistId !== null) {
      return <PlaylistDetail playlistId={openPlaylistId} onBack={() => setOpenPlaylistId(null)} />;
    }
    return <PlaylistList onOpenPlaylist={setOpenPlaylistId} />;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex border-b border-border">
        <button
          className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "search" ? "border-green-500 text-green-500" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("search")}
        >
          <Search className="h-4 w-4" /> Поиск
        </button>
        <button
          className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "playlists" ? "border-green-500 text-green-500" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("playlists")}
        >
          <ListMusic className="h-4 w-4" /> Плейлисты
        </button>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {tab === "search" ? searchContent : renderPlaylistsContent()}
      </div>
    </div>
  );
}
```

**Step 2:** Проверить `npx tsc --noEmit` в `client/`

**Step 3:** Коммит

```bash
git add client/src/components/MainContent.tsx
git commit -m "feat: add MainContent component with Search/Playlists tabs"
```

---

### Task 6: Обновить TrackList — DropdownMenu вместо ListPlus

**Files:**
- Modify: `client/src/components/TrackList.tsx`

**Step 1:** Заменить кнопку ListPlus на DropdownMenu.

Изменения в `TrackList.tsx`:

1. Обновить пропсы — добавить `onAddToPlaylist`:

```typescript
interface TrackListProps {
  tracks: Track[];
  onPlay: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist?: (track: Track, playlistId: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}
```

2. Внутри компонента:

```tsx
import { usePlaylistsStore } from "@/stores/playlists";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, ThumbsUp, Clock, ArrowUpDown, Loader2, ListPlus, Plus, MoreVertical } from "lucide-react";
```

3. Заменить кнопку ListPlus (строки ~117-124) на:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="opacity-0 group-hover:opacity-100 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddToQueue(track); }}>
      <ListPlus className="h-4 w-4 mr-2" /> В очередь
    </DropdownMenuItem>
    <TrackPlaylistSubmenu track={track} onAddToPlaylist={onAddToPlaylist} />
  </DropdownMenuContent>
</DropdownMenu>
```

4. Добавить вспомогательный компонент (внутри файла, перед `export function TrackList`):

```tsx
function TrackPlaylistSubmenu({ track, onAddToPlaylist }: { track: Track; onAddToPlaylist?: (track: Track, playlistId: number) => void }) {
  const playlists = usePlaylistsStore((s) => s.playlists);
  const createPlaylist = usePlaylistsStore((s) => s.createPlaylist);
  const addTrack = usePlaylistsStore((s) => s.addTrack);
  const loadPlaylists = usePlaylistsStore((s) => s.loadPlaylists);

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  const handleAdd = (playlistId: number) => {
    if (onAddToPlaylist) {
      onAddToPlaylist(track, playlistId);
    } else {
      addTrack(playlistId, track);
    }
  };

  const handleCreateAndAdd = async () => {
    const name = prompt("Название плейлиста:");
    if (!name?.trim()) return;
    await createPlaylist(name.trim());
    const { playlists: updated } = usePlaylistsStore.getState();
    if (updated.length > 0) {
      addTrack(updated[0].id, track);
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>В плейлист</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {playlists.map((pl) => (
          <DropdownMenuItem key={pl.id} onClick={() => handleAdd(pl.id)}>
            {pl.name}
          </DropdownMenuItem>
        ))}
        {playlists.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={handleCreateAndAdd}>
          <Plus className="h-4 w-4 mr-2 text-green-500" />
          <span className="text-green-500">Создать новый</span>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
```

Не забыть добавить `import { useState, useMemo, useEffect } from "react"` (добавить `useEffect`).

**Step 2:** Проверить `npx tsc --noEmit` в `client/`

**Step 3:** Коммит

```bash
git add client/src/components/TrackList.tsx
git commit -m "feat: replace ListPlus with DropdownMenu in TrackList"
```

---

### Task 7: Обновить Layout — убрать Sidebar

**Files:**
- Modify: `client/src/components/Layout.tsx`
- Delete: `client/src/components/Sidebar.tsx`

**Step 1:** Обновить `client/src/components/Layout.tsx`:

Убрать импорт Sidebar. Layout становится:

```tsx
import { Queue } from "@/components/Queue";

interface LayoutProps {
  children: React.ReactNode;
  desktopPlayer: React.ReactNode;
  mobileBottom: React.ReactNode;
}

export function Layout({ children, desktopPlayer, mobileBottom }: LayoutProps) {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-4 py-3 shrink-0">
        <h1 className="text-xl font-bold">MusicPlay</h1>
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </main>
        <div className="hidden md:flex">
          <Queue />
        </div>
      </div>
      <div className="hidden md:block shrink-0">{desktopPlayer}</div>
      {mobileBottom}
    </div>
  );
}
```

**Step 2:** Удалить `client/src/components/Sidebar.tsx`

```bash
rm client/src/components/Sidebar.tsx
```

**Step 3:** Проверить `npx tsc --noEmit` — будет ошибка в App.tsx (следующая задача)

**Step 4:** Коммит пока не делаем — связано с Task 8

---

### Task 8: Обновить App.tsx — интеграция MainContent

**Files:**
- Modify: `client/src/App.tsx`

**Step 1:** Обновить `client/src/App.tsx`:

1. Убрать импорт `Sidebar`
2. Добавить импорт `MainContent`:
```tsx
import { MainContent } from "@/components/MainContent";
```

3. Убрать из state/store: `activePlaylistId`, `activePlaylistTracks` (не нужны на верхнем уровне)

4. Десктопный контент заменить:

```tsx
{/* Desktop */}
<div className="hidden md:flex md:flex-col md:flex-1 min-h-0">
  <MainContent
    searchContent={
      <>
        <div className="p-4 flex justify-center">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <TrackList
            tracks={searchResults}
            onPlay={play}
            onAddToQueue={addToQueue}
            onLoadMore={handleLoadMore}
            hasMore={!!nextPageToken}
            isLoading={isSearching}
          />
        </div>
      </>
    }
  />
</div>
```

5. Мобильный контент — в case `"playlists"` убрать `<Sidebar />`, заменить на:

```tsx
case "playlists":
  return (
    <div className="flex-1 overflow-auto">
      <MobilePlaylistsView />
    </div>
  );
```

6. Добавить простой `MobilePlaylistsView` (внутри App.tsx или отдельным компонентом):

```tsx
function MobilePlaylistsView() {
  const [openId, setOpenId] = useState<number | null>(null);
  if (openId !== null) {
    return <PlaylistDetail playlistId={openId} onBack={() => setOpenId(null)} />;
  }
  return <PlaylistList onOpenPlaylist={setOpenId} />;
}
```

Добавить импорты:
```tsx
import { PlaylistList } from "@/components/PlaylistList";
import { PlaylistDetail } from "@/components/PlaylistDetail";
```

**Step 2:** Проверить `npx tsc --noEmit` в `client/` — должно быть чисто

**Step 3:** Коммит (Task 7 + Task 8 вместе)

```bash
git add -A
git commit -m "feat: remove Sidebar, add MainContent with Search/Playlists tabs"
```

---

### Task 9: Финальная проверка и чистка

**Step 1:** Запустить TypeScript проверку

```bash
cd client && npx tsc --noEmit
```

**Step 2:** Запустить dev-сервер и проверить:

```bash
cd .. && npm run dev
```

Проверить:
- Десктоп: табы Поиск/Плейлисты, поиск работает, DropdownMenu на треках, создание/удаление плейлистов, открытие плейлиста, drag-reorder, воспроизведение
- Мобильный: таб Плейлисты работает, те же компоненты

**Step 3:** Если остались неиспользуемые импорты — почистить

**Step 4:** Финальный коммит (если были изменения)

```bash
git add -A
git commit -m "fix: cleanup after playlists redesign"
```
