# MusicPlay MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Создать персональный веб-плеер для YouTube, где бэкенд выступает прокси — стримит аудио с YouTube, а фронтенд предоставляет свой аудиоплеер с плейлистами и очередью.

**Architecture:** Монорепо с двумя пакетами: `client` (React SPA) и `server` (Express API). Бэкенд использует yt-dlp для извлечения аудио-потока из YouTube и проксирует его на фронтенд. Поиск выполняется через YouTube Data API v3 на сервере. Плейлисты хранятся в SQLite. Фронтенд использует HTML5 Audio API для воспроизведения.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui (клиент), Express + TypeScript + yt-dlp + better-sqlite3 (сервер), Vitest + Playwright (тесты)

---

### Task 1: Инициализация монорепо

**Files:**
- Create: `package.json` (корневой)
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `server/src/index.ts`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Создать корневой package.json**

```json
{
  "name": "musicplay",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "test": "cd server && npm test && cd ../client && npm test",
    "test:server": "cd server && npm test",
    "test:client": "cd client && npm test"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

**Step 2: Инициализировать сервер**

```bash
mkdir -p server/src
cd server && npm init -y
npm install express cors dotenv better-sqlite3 yt-dlp-wrap
npm install -D typescript @types/express @types/cors @types/better-sqlite3 @types/node tsx vitest
```

`server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

`server/package.json` scripts:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`server/src/index.ts`:
```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

**Step 3: Инициализировать клиент**

```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
npx shadcn@latest init -d
npx shadcn@latest add button input card scroll-area slider
npm install zustand lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

`client/src/App.tsx`:
```tsx
function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <h1 className="text-2xl p-4">MusicPlay</h1>
    </div>
  );
}

export default App;
```

**Step 4: Создать .gitignore и .env.example**

`.gitignore`:
```
node_modules/
dist/
.env
*.db
```

`.env.example`:
```
PORT=3001
YOUTUBE_API_KEY=your_youtube_api_key_here
```

**Step 5: Установить корневые зависимости и проверить запуск**

```bash
cd /Users/oleg/Projects/musicplay
npm install
npm run dev
```

Expected: сервер стартует на 3001, клиент на 5173.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize monorepo with client (React+Vite) and server (Express)"
```

---

### Task 2: Дизайн — макеты основных экранов в Pencil

**Агент:** `/designer`

**Files:**
- Create: `design/main-layout.pen` — общий лейаут приложения
- Create: `design/player.pen` — панель плеера
- Create: `design/search-results.pen` — страница результатов поиска
- Create: `design/playlist.pen` — страница плейлиста
- Create: `design/tokens.md` — дизайн-токены (цвета, шрифты, отступы)

**Step 1: Определить дизайн-токены**

`design/tokens.md` — задать основу дизайн-системы:
- Тёмная тема по умолчанию (как Spotify, YouTube Music)
- Цветовая палитра: фон `#0a0a0a`, карточки `#1a1a1a`, акцент `#22c55e` (зелёный), текст `#fafafa` / `#a1a1aa`
- Шрифт: Inter или системный sans-serif
- Скругления: 8px компоненты, 4px мелкие элементы
- Отступы: 4/8/12/16/24px сетка

**Step 2: Спроектировать общий лейаут в Pencil**

Использовать **pencil MCP** для создания макета `design/main-layout.pen`:
- Трёхколоночная структура: Sidebar (240px) | Main Content (flex) | Queue (256px)
- Хедер сверху: логотип "MusicPlay" слева
- Плеер-бар внизу: фиксированный, на всю ширину
- Sidebar: список плейлистов, кнопка "Новый плейлист", пункт "Поиск"
- Queue: очередь воспроизведения с кнопками shuffle/clear

**Step 3: Спроектировать поисковую строку и результаты**

Макет `design/search-results.pen`:
- Поисковая строка по центру вверху main area
- Результаты — список треков: обложка 48x48, название, исполнитель, длительность, кнопка "+"
- Hover-состояние строки трека

**Step 4: Спроектировать панель плеера**

Макет `design/player.pen`:
- Слева: обложка 48x48 + название + исполнитель
- Центр: прогресс-бар с временными метками
- Справа: кнопки play/pause, skip, ползунок громкости
- Компактный, не более 72px высотой

**Step 5: Спроектировать вид плейлиста**

Макет `design/playlist.pen`:
- Заголовок плейлиста с количеством треков
- Кнопка "Воспроизвести все"
- Список треков (тот же компонент, что и в поиске, + кнопка удаления)

**Step 6: Согласовать макеты и commit**

Показать макеты, получить одобрение, зафиксировать:
```bash
git add design/
git commit -m "design: create UI mockups and design tokens in Pencil"
```

---

### Task 3: Бэкенд — эндпоинт поиска YouTube (параллельно с Task 2)

**Files:**
- Create: `server/src/routes/search.ts`
- Create: `server/src/services/youtube.ts`
- Create: `server/src/types.ts`
- Modify: `server/src/index.ts`
- Test: `server/src/__tests__/search.test.ts`

**Step 1: Определить типы**

`server/src/types.ts`:
```typescript
export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number; // seconds
}

export interface SearchResult {
  tracks: Track[];
  nextPageToken?: string;
}
```

**Step 2: Написать falling тест для YouTube-сервиса**

`server/src/__tests__/search.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { searchYouTube, parseYouTubeUrl } from "../services/youtube";

describe("parseYouTubeUrl", () => {
  it("extracts video ID from standard URL", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("extracts video ID from short URL", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URL", () => {
    expect(parseYouTubeUrl("https://example.com")).toBeNull();
  });

  it("returns null for plain search query", () => {
    expect(parseYouTubeUrl("lofi hip hop")).toBeNull();
  });
});
```

**Step 3: Запустить тест — убедиться что падает**

```bash
cd server && npx vitest run src/__tests__/search.test.ts
```
Expected: FAIL — модуль не найден.

**Step 4: Реализовать parseYouTubeUrl**

`server/src/services/youtube.ts`:
```typescript
import type { Track, SearchResult } from "../types";

const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export function parseYouTubeUrl(input: string): string | null {
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function searchYouTube(query: string): Promise<SearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10"); // Music
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json();

  const tracks: Track[] = data.items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration: 0, // will be enriched later
  }));

  return { tracks, nextPageToken: data.nextPageToken };
}

export async function getVideoInfo(videoId: string): Promise<Track> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json();
  const item = data.items[0];
  if (!item) throw new Error(`Video not found: ${videoId}`);

  const duration = parseDuration(item.contentDetails.duration);

  return {
    id: videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration,
  };
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}
```

**Step 5: Запустить тест — убедиться что проходит**

```bash
cd server && npx vitest run src/__tests__/search.test.ts
```
Expected: PASS.

**Step 6: Создать роут поиска**

`server/src/routes/search.ts`:
```typescript
import { Router } from "express";
import { searchYouTube, parseYouTubeUrl, getVideoInfo } from "../services/youtube";

const router = Router();

router.get("/", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const videoId = parseYouTubeUrl(query);

    if (videoId) {
      const track = await getVideoInfo(videoId);
      return res.json({ tracks: [track] });
    }

    const results = await searchYouTube(query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

**Step 7: Подключить роут к серверу**

Добавить в `server/src/index.ts`:
```typescript
import searchRouter from "./routes/search";
// ...после app.use(express.json()):
app.use("/api/search", searchRouter);
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add YouTube search endpoint with URL parsing"
```

---

### Task 4: Бэкенд — аудио-прокси через yt-dlp

**Files:**
- Create: `server/src/routes/stream.ts`
- Create: `server/src/services/audio.ts`
- Create: `server/src/__tests__/audio.test.ts`
- Modify: `server/src/index.ts`

**Step 1: Написать falling тест для аудио-сервиса**

`server/src/__tests__/audio.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildStreamUrl } from "../services/audio";

describe("buildStreamUrl", () => {
  it("throws on empty video ID", () => {
    expect(() => buildStreamUrl("")).toThrow();
  });

  it("returns a string URL for valid video ID", () => {
    const url = buildStreamUrl("dQw4w9WgXcQ");
    expect(typeof url).toBe("string");
    expect(url).toContain("dQw4w9WgXcQ");
  });
});
```

**Step 2: Запустить тест — убедиться что падает**

```bash
cd server && npx vitest run src/__tests__/audio.test.ts
```
Expected: FAIL.

**Step 3: Реализовать аудио-сервис**

`server/src/services/audio.ts`:
```typescript
import { spawn } from "child_process";
import type { Readable } from "stream";

export function buildStreamUrl(videoId: string): string {
  if (!videoId) throw new Error("Video ID is required");
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getAudioStream(videoId: string): Readable {
  const url = buildStreamUrl(videoId);

  const ytdlp = spawn("yt-dlp", [
    "-f", "bestaudio",
    "-o", "-",
    "--no-playlist",
    "--no-warnings",
    url,
  ]);

  ytdlp.stderr.on("data", (data) => {
    console.error(`yt-dlp stderr: ${data}`);
  });

  return ytdlp.stdout;
}
```

**Step 4: Запустить тест — убедиться что проходит**

```bash
cd server && npx vitest run src/__tests__/audio.test.ts
```
Expected: PASS.

**Step 5: Создать роут стриминга**

`server/src/routes/stream.ts`:
```typescript
import { Router } from "express";
import { getAudioStream } from "../services/audio";

const router = Router();

router.get("/:videoId", (req, res) => {
  const { videoId } = req.params;

  if (!videoId || videoId.length !== 11) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  res.setHeader("Content-Type", "audio/webm");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  const stream = getAudioStream(videoId);

  stream.pipe(res);

  stream.on("error", (err) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Stream failed" });
    }
  });

  req.on("close", () => {
    stream.destroy();
  });
});

export default router;
```

**Step 6: Подключить роут к серверу**

Добавить в `server/src/index.ts`:
```typescript
import streamRouter from "./routes/stream";
// ...
app.use("/api/stream", streamRouter);
```

**Step 7: Проверить вручную что yt-dlp установлен**

```bash
yt-dlp --version
```
Если не установлен:
```bash
brew install yt-dlp
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add audio proxy streaming via yt-dlp"
```

---

### Task 5: Фронтенд — лейаут и поле поиска (по макетам из Task 2)

**Files:**
- Create: `client/src/components/SearchBar.tsx`
- Create: `client/src/components/Layout.tsx`
- Create: `client/src/lib/api.ts`
- Create: `client/src/stores/player.ts`
- Create: `client/src/__tests__/SearchBar.test.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Настроить Vitest для клиента**

`client/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

`client/src/test-setup.ts`:
```typescript
import "@testing-library/jest-dom";
```

**Step 2: Создать API-клиент**

`client/src/lib/api.ts`:
```typescript
const API_BASE = "http://localhost:3001/api";

export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.tracks;
}

export function getStreamUrl(videoId: string): string {
  return `${API_BASE}/stream/${videoId}`;
}
```

**Step 3: Создать Zustand-стор плеера**

`client/src/stores/player.ts`:
```typescript
import { create } from "zustand";
import type { Track } from "@/lib/api";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  searchResults: Track[];

  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  playNext: () => void;
  playPrev: () => void;
  setSearchResults: (tracks: Track[]) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  searchResults: [],

  play: (track) => set({ currentTrack: track, isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  resume: () => set({ isPlaying: true }),

  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),

  removeFromQueue: (index) =>
    set((state) => ({
      queue: state.queue.filter((_, i) => i !== index),
    })),

  playNext: () => {
    const { queue, currentTrack } = get();
    if (queue.length === 0) {
      set({ currentTrack: null, isPlaying: false });
      return;
    }
    const [next, ...rest] = queue;
    set({ currentTrack: next, queue: rest, isPlaying: true });
  },

  playPrev: () => {
    // В MVP — перемотка в начало текущего трека
    // Реализуется на уровне аудио-элемента
  },

  setSearchResults: (tracks) => set({ searchResults: tracks }),

  clearQueue: () => set({ queue: [] }),
}));
```

**Step 4: Написать falling тест для SearchBar**

`client/src/__tests__/SearchBar.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SearchBar } from "../components/SearchBar";

describe("SearchBar", () => {
  it("renders input field", () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText(/ссылка|поиск/i)).toBeInTheDocument();
  });

  it("calls onSearch when submitting", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/ссылка|поиск/i);
    await userEvent.type(input, "lofi beats{Enter}");

    expect(onSearch).toHaveBeenCalledWith("lofi beats");
  });
});
```

**Step 5: Запустить тест — убедиться что падает**

```bash
cd client && npx vitest run src/__tests__/SearchBar.test.tsx
```
Expected: FAIL.

**Step 6: Реализовать SearchBar**

`client/src/components/SearchBar.tsx`:
```tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Вставьте ссылку на YouTube или введите поиск..."
        className="flex-1"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading || !query.trim()}>
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
```

**Step 7: Создать Layout и обновить App**

`client/src/components/Layout.tsx`:
```tsx
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-bold">MusicPlay</h1>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
```

`client/src/App.tsx`:
```tsx
import { Layout } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { searchTracks } from "@/lib/api";
import { usePlayerStore } from "@/stores/player";

function App() {
  const setSearchResults = usePlayerStore((s) => s.setSearchResults);

  const handleSearch = async (query: string) => {
    const tracks = await searchTracks(query);
    setSearchResults(tracks);
  };

  return (
    <Layout>
      <div className="p-4 flex justify-center">
        <SearchBar onSearch={handleSearch} />
      </div>
    </Layout>
  );
}

export default App;
```

**Step 8: Запустить тест — убедиться что проходит**

```bash
cd client && npx vitest run src/__tests__/SearchBar.test.tsx
```
Expected: PASS.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add search bar, layout, API client, and player store"
```

---

### Task 6: Фронтенд — результаты поиска

**Files:**
- Create: `client/src/components/TrackList.tsx`
- Create: `client/src/__tests__/TrackList.test.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Написать falling тест для TrackList**

`client/src/__tests__/TrackList.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TrackList } from "../components/TrackList";

const mockTracks = [
  { id: "abc", title: "Test Song", artist: "Artist", thumbnail: "http://img.jpg", duration: 240 },
  { id: "def", title: "Another Song", artist: "Band", thumbnail: "http://img2.jpg", duration: 180 },
];

describe("TrackList", () => {
  it("renders track titles", () => {
    render(<TrackList tracks={mockTracks} onPlay={vi.fn()} onAddToQueue={vi.fn()} />);
    expect(screen.getByText("Test Song")).toBeInTheDocument();
    expect(screen.getByText("Another Song")).toBeInTheDocument();
  });

  it("calls onPlay when track is clicked", async () => {
    const onPlay = vi.fn();
    render(<TrackList tracks={mockTracks} onPlay={onPlay} onAddToQueue={vi.fn()} />);

    await userEvent.click(screen.getByText("Test Song"));
    expect(onPlay).toHaveBeenCalledWith(mockTracks[0]);
  });
});
```

**Step 2: Запустить тест — падает**

```bash
cd client && npx vitest run src/__tests__/TrackList.test.tsx
```

**Step 3: Реализовать TrackList**

`client/src/components/TrackList.tsx`:
```tsx
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
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-12 h-12 rounded object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDuration(track.duration)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(track);
            }}
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Подключить в App.tsx**

Обновить `client/src/App.tsx` — добавить `TrackList` под `SearchBar`:
```tsx
import { TrackList } from "@/components/TrackList";

// В App компоненте:
const searchResults = usePlayerStore((s) => s.searchResults);
const play = usePlayerStore((s) => s.play);
const addToQueue = usePlayerStore((s) => s.addToQueue);

// В JSX после SearchBar:
<div className="flex-1 overflow-auto p-4">
  <TrackList tracks={searchResults} onPlay={play} onAddToQueue={addToQueue} />
</div>
```

**Step 5: Запустить тест — проходит**

```bash
cd client && npx vitest run src/__tests__/TrackList.test.tsx
```
Expected: PASS.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add track list with search results display"
```

---

### Task 7: Фронтенд — аудиоплеер

**Files:**
- Create: `client/src/components/Player.tsx`
- Create: `client/src/hooks/useAudio.ts`
- Create: `client/src/__tests__/Player.test.tsx`
- Modify: `client/src/components/Layout.tsx`

**Step 1: Написать falling тест для Player**

`client/src/__tests__/Player.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Player } from "../components/Player";

describe("Player", () => {
  it("shows nothing when no track", () => {
    const { container } = render(<Player />);
    expect(container.querySelector("[data-testid='player']")).toBeNull();
  });
});
```

**Step 2: Запустить — падает**

```bash
cd client && npx vitest run src/__tests__/Player.test.tsx
```

**Step 3: Создать хук useAudio**

`client/src/hooks/useAudio.ts`:
```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import { getStreamUrl } from "@/lib/api";

interface UseAudioReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (videoId: string) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
}

export function useAudio(onEnded?: () => void): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      onEnded?.();
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [onEnded]);

  const play = useCallback((videoId: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = getStreamUrl(videoId);
    audio.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol;
    setVolumeState(vol);
  }, []);

  return { isPlaying, currentTime, duration, volume, play, pause, resume, seek, setVolume };
}
```

**Step 4: Реализовать Player**

`client/src/components/Player.tsx`:
```tsx
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
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-12 h-12 rounded"
        />
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
```

**Step 5: Добавить Player в Layout**

Обновить `client/src/components/Layout.tsx`:
```tsx
import { Player } from "./Player";

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-bold">MusicPlay</h1>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      <Player />
    </div>
  );
}
```

**Step 6: Запустить тест — проходит**

```bash
cd client && npx vitest run src/__tests__/Player.test.tsx
```
Expected: PASS.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add audio player with streaming from backend"
```

---

### Task 8: Бэкенд — плейлисты (CRUD, SQLite)

**Files:**
- Create: `server/src/db.ts`
- Create: `server/src/routes/playlists.ts`
- Create: `server/src/__tests__/playlists.test.ts`
- Modify: `server/src/index.ts`

**Step 1: Написать falling тест для работы с плейлистами**

`server/src/__tests__/playlists.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { initDb, getDb } from "../db";

describe("Playlists DB", () => {
  beforeEach(() => {
    initDb(":memory:");
  });

  it("creates a playlist", () => {
    const db = getDb();
    const result = db.prepare("INSERT INTO playlists (name) VALUES (?)").run("My Playlist");
    expect(result.lastInsertRowid).toBe(1);
  });

  it("adds a track to playlist", () => {
    const db = getDb();
    db.prepare("INSERT INTO playlists (name) VALUES (?)").run("My Playlist");
    db.prepare(
      "INSERT INTO playlist_tracks (playlist_id, video_id, title, artist, thumbnail, duration, position) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(1, "abc123", "Song", "Artist", "http://img.jpg", 240, 0);

    const tracks = db.prepare("SELECT * FROM playlist_tracks WHERE playlist_id = ?").all(1);
    expect(tracks).toHaveLength(1);
  });
});
```

**Step 2: Запустить — падает**

```bash
cd server && npx vitest run src/__tests__/playlists.test.ts
```

**Step 3: Реализовать модуль БД**

`server/src/db.ts`:
```typescript
import Database from "better-sqlite3";

let db: Database.Database;

export function initDb(path: string = "./musicplay.db"): void {
  db = new Database(path);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      thumbnail TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      position INTEGER NOT NULL,
      added_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export function getDb(): Database.Database {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");
  return db;
}
```

**Step 4: Запустить тест — проходит**

```bash
cd server && npx vitest run src/__tests__/playlists.test.ts
```
Expected: PASS.

**Step 5: Создать CRUD-роуты для плейлистов**

`server/src/routes/playlists.ts`:
```typescript
import { Router } from "express";
import { getDb } from "../db";

const router = Router();

// GET /api/playlists
router.get("/", (_req, res) => {
  const db = getDb();
  const playlists = db.prepare("SELECT * FROM playlists ORDER BY created_at DESC").all();
  res.json(playlists);
});

// POST /api/playlists
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const db = getDb();
  const result = db.prepare("INSERT INTO playlists (name) VALUES (?)").run(name);
  res.status(201).json({ id: result.lastInsertRowid, name });
});

// DELETE /api/playlists/:id
router.delete("/:id", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM playlists WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

// GET /api/playlists/:id/tracks
router.get("/:id/tracks", (req, res) => {
  const db = getDb();
  const tracks = db
    .prepare("SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position")
    .all(req.params.id);
  res.json(tracks);
});

// POST /api/playlists/:id/tracks
router.post("/:id/tracks", (req, res) => {
  const { video_id, title, artist, thumbnail, duration } = req.body;
  if (!video_id || !title) {
    return res.status(400).json({ error: "video_id and title are required" });
  }

  const db = getDb();
  const maxPos = db
    .prepare("SELECT MAX(position) as max FROM playlist_tracks WHERE playlist_id = ?")
    .get(req.params.id) as any;

  const position = (maxPos?.max ?? -1) + 1;

  const result = db
    .prepare(
      "INSERT INTO playlist_tracks (playlist_id, video_id, title, artist, thumbnail, duration, position) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(req.params.id, video_id, title, artist || "", thumbnail || "", duration || 0, position);

  res.status(201).json({ id: result.lastInsertRowid });
});

// DELETE /api/playlists/:playlistId/tracks/:trackId
router.delete("/:playlistId/tracks/:trackId", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM playlist_tracks WHERE id = ? AND playlist_id = ?").run(
    req.params.trackId,
    req.params.playlistId
  );
  res.status(204).end();
});

export default router;
```

**Step 6: Подключить к серверу**

Добавить в `server/src/index.ts`:
```typescript
import { initDb } from "./db";
import playlistsRouter from "./routes/playlists";

// Перед app.listen:
initDb();

app.use("/api/playlists", playlistsRouter);
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add playlists CRUD with SQLite storage"
```

---

### Task 9: Фронтенд — плейлисты и боковая панель

**Files:**
- Create: `client/src/components/Sidebar.tsx`
- Create: `client/src/components/PlaylistView.tsx`
- Create: `client/src/stores/playlists.ts`
- Create: `client/src/lib/playlist-api.ts`
- Create: `client/src/__tests__/Sidebar.test.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/Layout.tsx`

**Step 1: Создать API-клиент для плейлистов**

`client/src/lib/playlist-api.ts`:
```typescript
import type { Track } from "./api";

const API_BASE = "http://localhost:3001/api";

export interface Playlist {
  id: number;
  name: string;
  created_at: string;
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await fetch(`${API_BASE}/playlists`);
  if (!res.ok) throw new Error("Failed to fetch playlists");
  return res.json();
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const res = await fetch(`${API_BASE}/playlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create playlist");
  return res.json();
}

export async function deletePlaylist(id: number): Promise<void> {
  await fetch(`${API_BASE}/playlists/${id}`, { method: "DELETE" });
}

export async function fetchPlaylistTracks(playlistId: number): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`);
  if (!res.ok) throw new Error("Failed to fetch playlist tracks");
  return res.json();
}

export async function addTrackToPlaylist(playlistId: number, track: Track): Promise<void> {
  await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      duration: track.duration,
    }),
  });
}

export async function removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<void> {
  await fetch(`${API_BASE}/playlists/${playlistId}/tracks/${trackId}`, { method: "DELETE" });
}
```

**Step 2: Создать стор плейлистов**

`client/src/stores/playlists.ts`:
```typescript
import { create } from "zustand";
import type { Track } from "@/lib/api";
import type { Playlist } from "@/lib/playlist-api";
import * as api from "@/lib/playlist-api";

interface PlaylistsState {
  playlists: Playlist[];
  activePlaylistId: number | null;
  activePlaylistTracks: Track[];

  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (id: number) => Promise<void>;
  selectPlaylist: (id: number | null) => Promise<void>;
  addTrack: (playlistId: number, track: Track) => Promise<void>;
  removeTrack: (playlistId: number, trackId: number) => Promise<void>;
}

export const usePlaylistsStore = create<PlaylistsState>((set, get) => ({
  playlists: [],
  activePlaylistId: null,
  activePlaylistTracks: [],

  loadPlaylists: async () => {
    const playlists = await api.fetchPlaylists();
    set({ playlists });
  },

  createPlaylist: async (name) => {
    await api.createPlaylist(name);
    await get().loadPlaylists();
  },

  deletePlaylist: async (id) => {
    await api.deletePlaylist(id);
    const { activePlaylistId } = get();
    if (activePlaylistId === id) {
      set({ activePlaylistId: null, activePlaylistTracks: [] });
    }
    await get().loadPlaylists();
  },

  selectPlaylist: async (id) => {
    if (id === null) {
      set({ activePlaylistId: null, activePlaylistTracks: [] });
      return;
    }
    const tracks = await api.fetchPlaylistTracks(id);
    set({ activePlaylistId: id, activePlaylistTracks: tracks });
  },

  addTrack: async (playlistId, track) => {
    await api.addTrackToPlaylist(playlistId, track);
    const { activePlaylistId } = get();
    if (activePlaylistId === playlistId) {
      await get().selectPlaylist(playlistId);
    }
  },

  removeTrack: async (playlistId, trackId) => {
    await api.removeTrackFromPlaylist(playlistId, trackId);
    const { activePlaylistId } = get();
    if (activePlaylistId === playlistId) {
      await get().selectPlaylist(playlistId);
    }
  },
}));
```

**Step 3: Написать falling тест Sidebar**

`client/src/__tests__/Sidebar.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Sidebar } from "../components/Sidebar";

describe("Sidebar", () => {
  it("renders playlists heading", () => {
    render(<Sidebar />);
    expect(screen.getByText(/плейлист/i)).toBeInTheDocument();
  });
});
```

**Step 4: Запустить — падает**

```bash
cd client && npx vitest run src/__tests__/Sidebar.test.tsx
```

**Step 5: Реализовать Sidebar**

`client/src/components/Sidebar.tsx`:
```tsx
import { useEffect, useState } from "react";
import { usePlaylistsStore } from "@/stores/playlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Music } from "lucide-react";

export function Sidebar() {
  const { playlists, activePlaylistId, loadPlaylists, createPlaylist, deletePlaylist, selectPlaylist } =
    usePlaylistsStore();
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName("");
    }
  };

  return (
    <aside className="w-60 border-r flex flex-col">
      <div className="p-3 border-b">
        <h2 className="text-sm font-semibold mb-2">Плейлисты</h2>
        <div className="flex gap-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Новый плейлист..."
            className="text-xs h-8"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <button
            className={`w-full text-left text-sm px-2 py-1.5 rounded ${
              activePlaylistId === null ? "bg-muted" : "hover:bg-muted"
            }`}
            onClick={() => selectPlaylist(null)}
          >
            <Music className="h-4 w-4 inline mr-2" />
            Поиск
          </button>
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm cursor-pointer ${
                activePlaylistId === pl.id ? "bg-muted" : "hover:bg-muted"
              }`}
              onClick={() => selectPlaylist(pl.id)}
            >
              <span className="flex-1 truncate">{pl.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlaylist(pl.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
```

**Step 6: Обновить Layout и App**

Обновить `client/src/components/Layout.tsx` — добавить Sidebar:
```tsx
import { Sidebar } from "./Sidebar";
import { Player } from "./Player";

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-bold">MusicPlay</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
      <Player />
    </div>
  );
}
```

**Step 7: Запустить тест — проходит**

```bash
cd client && npx vitest run src/__tests__/Sidebar.test.tsx
```
Expected: PASS.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add playlists sidebar with create/delete/select"
```

---

### Task 10: Фронтенд — очередь воспроизведения

**Files:**
- Create: `client/src/components/Queue.tsx`
- Create: `client/src/__tests__/Queue.test.tsx`
- Modify: `client/src/components/Layout.tsx`
- Modify: `client/src/stores/player.ts`

**Step 1: Написать falling тест для Queue**

`client/src/__tests__/Queue.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Queue } from "../components/Queue";

describe("Queue", () => {
  it("renders queue heading", () => {
    render(<Queue />);
    expect(screen.getByText(/очередь/i)).toBeInTheDocument();
  });
});
```

**Step 2: Запустить — падает**

```bash
cd client && npx vitest run src/__tests__/Queue.test.tsx
```

**Step 3: Добавить shuffle в стор плеера**

Обновить `client/src/stores/player.ts` — добавить метод `shuffle`:
```typescript
shuffle: () =>
  set((state) => {
    const shuffled = [...state.queue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { queue: shuffled };
  }),
```

**Step 4: Реализовать Queue**

`client/src/components/Queue.tsx`:
```tsx
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
    <aside className="w-64 border-l flex flex-col">
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
```

**Step 5: Добавить Queue в Layout**

Обновить Layout — добавить Queue справа:
```tsx
import { Queue } from "./Queue";

// В div.flex:
<div className="flex flex-1 overflow-hidden">
  <Sidebar />
  <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
  <Queue />
</div>
```

**Step 6: Запустить тест — проходит**

```bash
cd client && npx vitest run src/__tests__/Queue.test.tsx
```
Expected: PASS.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add playback queue with shuffle and clear"
```

---

### Task 11: Интеграция и тёмная тема

**Files:**
- Modify: `client/src/App.tsx` (финальная сборка)
- Modify: `client/src/index.css` (тёмная тема)
- Modify: `client/vite.config.ts` (прокси для API)

**Step 1: Настроить прокси в Vite**

Обновить `client/vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
```

Обновить `client/src/lib/api.ts` — убрать хардкод хоста:
```typescript
const API_BASE = "/api";
```

То же в `client/src/lib/playlist-api.ts`.

**Step 2: Включить тёмную тему по умолчанию**

Добавить `dark` класс на `<html>` в `client/index.html`:
```html
<html lang="ru" class="dark">
```

**Step 3: Финальная сборка App.tsx**

Собрать все компоненты в `App.tsx` — отображение поиска или плейлиста в зависимости от activePlaylistId.

**Step 4: Запустить все тесты**

```bash
npm run test
```
Expected: все тесты проходят.

**Step 5: Проверить полный флоу вручную**

```bash
npm run dev
```
1. Открыть http://localhost:5173
2. Вставить ссылку на YouTube → видит трек → нажать play → слышит аудио
3. Поиск по запросу → результаты → добавить в очередь
4. Создать плейлист → добавить треки

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: integrate all components, add dark theme and API proxy"
```
