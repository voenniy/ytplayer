# Range-proxy Audio Streaming — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Заменить chunked-стриминг через yt-dlp stdout на Range-proxy к прямым URL аудиодорожек YouTube CDN.

**Architecture:** Сервер через `yt-dlp --dump-json` получает прямой URL аудиодорожки и её размер, кэширует на 4 часа, и проксирует Range-запросы браузера к YouTube CDN. Фронтенд не меняется.

**Tech Stack:** Node.js built-in fetch, child_process spawn, Express

---

### Task 1: Тест на resolveAudioUrl

**Files:**
- Modify: `server/src/__tests__/audio.test.ts`
- Modify: `server/src/services/audio.ts`

**Step 1: Написать тесты для resolveAudioUrl**

В `server/src/__tests__/audio.test.ts` добавить после существующих тестов:

```typescript
import { resolveAudioUrl, clearCache } from "../services/audio";
import { spawn } from "child_process";
import { vi } from "vitest";

vi.mock("child_process", () => ({
  spawn: vi.fn(),
}));

describe("resolveAudioUrl", () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  it("rejects invalid video ID", async () => {
    await expect(resolveAudioUrl("bad")).rejects.toThrow("Invalid video ID");
  });

  it("parses yt-dlp JSON and returns audio URL info", async () => {
    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === "data") {
          cb(Buffer.from(JSON.stringify({
            formats: [
              { vcodec: "avc1", acodec: "mp4a", url: "https://video.url", abr: 128, filesize: 5000, ext: "mp4" },
              { vcodec: "none", acodec: "opus", url: "https://audio.url", abr: 160, filesize: 3000, ext: "webm" },
              { vcodec: "none", acodec: "mp4a", url: "https://audio2.url", abr: 128, filesize: 2500, ext: "m4a" },
            ],
          })));
        }
        if (event === "end") cb();
        return mockStdout;
      }),
    };
    const mockStderr = { on: vi.fn().mockReturnThis() };
    const mockProcess = { stdout: mockStdout, stderr: mockStderr, on: vi.fn().mockReturnThis() };
    (spawn as any).mockReturnValue(mockProcess);

    const result = await resolveAudioUrl("dQw4w9WgXcQ");
    expect(result.audioUrl).toBe("https://audio.url");
    expect(result.contentLength).toBe(3000);
    expect(result.contentType).toBe("audio/webm");
  });

  it("uses cache on second call", async () => {
    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === "data") {
          cb(Buffer.from(JSON.stringify({
            formats: [
              { vcodec: "none", acodec: "opus", url: "https://cached.url", abr: 160, filesize: 3000, ext: "webm" },
            ],
          })));
        }
        if (event === "end") cb();
        return mockStdout;
      }),
    };
    const mockStderr = { on: vi.fn().mockReturnThis() };
    const mockProcess = { stdout: mockStdout, stderr: mockStderr, on: vi.fn().mockReturnThis() };
    (spawn as any).mockReturnValue(mockProcess);

    await resolveAudioUrl("dQw4w9WgXcQ");
    const result = await resolveAudioUrl("dQw4w9WgXcQ");

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(result.audioUrl).toBe("https://cached.url");
  });
});
```

**Step 2: Запустить тест, убедиться что падает**

Run: `cd server && npx vitest run src/__tests__/audio.test.ts`
Expected: FAIL — `resolveAudioUrl` и `clearCache` не экспортируются

**Step 3: Коммит**

```bash
git add server/src/__tests__/audio.test.ts
git commit -m "test: add failing tests for resolveAudioUrl"
```

---

### Task 2: Реализовать resolveAudioUrl + кэш

**Files:**
- Modify: `server/src/services/audio.ts`

**Step 1: Переписать audio.ts**

Заменить содержимое `server/src/services/audio.ts` на:

```typescript
import { spawn } from "child_process";

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 часа

export interface AudioInfo {
  audioUrl: string;
  contentLength: number;
  contentType: string;
}

interface CacheEntry extends AudioInfo {
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function isValidVideoId(videoId: string): boolean {
  return VIDEO_ID_REGEX.test(videoId);
}

export function buildStreamUrl(videoId: string): string {
  if (!videoId || !isValidVideoId(videoId)) {
    throw new Error("Invalid video ID");
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function clearCache(): void {
  cache.clear();
}

export function invalidateCache(videoId: string): void {
  cache.delete(videoId);
}

const EXT_TO_CONTENT_TYPE: Record<string, string> = {
  webm: "audio/webm",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  ogg: "audio/ogg",
  opus: "audio/ogg",
};

function pickBestAudioFormat(formats: any[]): { url: string; filesize: number; ext: string } | null {
  const audioOnly = formats.filter((f) => f.vcodec === "none" && f.acodec !== "none" && f.url);
  if (audioOnly.length === 0) return null;
  audioOnly.sort((a, b) => (b.abr || 0) - (a.abr || 0));
  const best = audioOnly[0];
  return {
    url: best.url,
    filesize: best.filesize || best.filesize_approx || 0,
    ext: best.ext || "webm",
  };
}

function fetchYtdlpJson(videoId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = buildStreamUrl(videoId);
    const proc = spawn("yt-dlp", ["--dump-json", "--no-warnings", "--no-playlist", url]);

    let stdout = "";
    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on("data", (data: Buffer) => {
      console.error(`yt-dlp stderr: ${data}`);
    });
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`yt-dlp exited with code ${code}`));
      try { resolve(JSON.parse(stdout)); }
      catch { reject(new Error("Failed to parse yt-dlp JSON")); }
    });
    proc.on("error", reject);
  });
}

export async function resolveAudioUrl(videoId: string): Promise<AudioInfo> {
  if (!videoId || !isValidVideoId(videoId)) {
    throw new Error("Invalid video ID");
  }

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return { audioUrl: cached.audioUrl, contentLength: cached.contentLength, contentType: cached.contentType };
  }

  cache.delete(videoId);

  const json = await fetchYtdlpJson(videoId);
  const best = pickBestAudioFormat(json.formats || []);
  if (!best) throw new Error("No audio format found");

  const entry: CacheEntry = {
    audioUrl: best.url,
    contentLength: best.filesize,
    contentType: EXT_TO_CONTENT_TYPE[best.ext] || "audio/webm",
    expiresAt: Date.now() + CACHE_TTL,
  };

  cache.set(videoId, entry);

  return { audioUrl: entry.audioUrl, contentLength: entry.contentLength, contentType: entry.contentType };
}
```

**Step 2: Запустить тесты**

Run: `cd server && npx vitest run src/__tests__/audio.test.ts`
Expected: все тесты PASS

**Step 3: Коммит**

```bash
git add server/src/services/audio.ts
git commit -m "feat: implement resolveAudioUrl with in-memory cache"
```

---

### Task 3: Переписать stream.ts — Range-proxy

**Files:**
- Modify: `server/src/routes/stream.ts`

**Step 1: Переписать stream.ts**

Заменить содержимое `server/src/routes/stream.ts` на:

```typescript
import { Router } from "express";
import { Readable } from "stream";
import { isValidVideoId, resolveAudioUrl, invalidateCache } from "../services/audio";

const router = Router();

function parseRange(header: string, total: number): { start: number; end: number } | null {
  const match = header.match(/bytes=(\d+)-(\d*)/);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : total - 1;
  if (start >= total || end >= total || start > end) return null;
  return { start, end };
}

async function proxyAudio(
  audioUrl: string,
  rangeHeader?: string,
): Promise<{ status: number; headers: Record<string, string>; body: ReadableStream<Uint8Array> | null }> {
  const fetchHeaders: Record<string, string> = {};
  if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

  const resp = await fetch(audioUrl, { headers: fetchHeaders });
  return { status: resp.status, headers: Object.fromEntries(resp.headers.entries()), body: resp.body };
}

router.get("/:videoId", async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidVideoId(videoId)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  let info;
  try {
    info = await resolveAudioUrl(videoId);
  } catch (err: any) {
    console.error("resolveAudioUrl failed:", err.message);
    return res.status(500).json({ error: "Failed to resolve audio" });
  }

  const rangeHeader = req.headers.range;
  const { audioUrl, contentLength, contentType } = info;

  // Retry helper: при 403 сбрасываем кэш и пробуем ещё раз
  const attempt = async (retry: boolean): Promise<void> => {
    try {
      if (rangeHeader && contentLength > 0) {
        const range = parseRange(rangeHeader, contentLength);
        if (!range) {
          res.status(416).json({ error: "Range not satisfiable" });
          return;
        }
        const { start, end } = range;

        const proxy = await proxyAudio(audioUrl, `bytes=${start}-${end}`);

        if (proxy.status === 403 && retry) {
          invalidateCache(videoId);
          const freshInfo = await resolveAudioUrl(videoId);
          return attempt.call(null, false);
        }

        res.writeHead(206, {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
        });

        if (proxy.body) {
          const nodeStream = Readable.fromWeb(proxy.body as any);
          nodeStream.pipe(res);
          req.on("close", () => nodeStream.destroy());
        } else {
          res.end();
        }
      } else {
        // Без Range — отдаём всё
        const proxy = await proxyAudio(audioUrl);

        if (proxy.status === 403 && retry) {
          invalidateCache(videoId);
          const freshInfo = await resolveAudioUrl(videoId);
          return attempt.call(null, false);
        }

        res.writeHead(200, {
          "Content-Type": contentType,
          ...(contentLength > 0 ? { "Content-Length": String(contentLength) } : {}),
          "Accept-Ranges": "bytes",
        });

        if (proxy.body) {
          const nodeStream = Readable.fromWeb(proxy.body as any);
          nodeStream.pipe(res);
          req.on("close", () => nodeStream.destroy());
        } else {
          res.end();
        }
      }
    } catch (err: any) {
      console.error("Stream proxy error:", err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: "Stream proxy failed" });
      }
    }
  };

  await attempt(true);
});

export default router;
```

**Step 2: Проверить TypeScript**

Run: `cd server && npx tsc --noEmit`
Expected: нет ошибок

**Step 3: Запустить все серверные тесты**

Run: `cd server && npx vitest run`
Expected: все PASS

**Step 4: Коммит**

```bash
git add server/src/routes/stream.ts
git commit -m "feat: rewrite stream route as Range-proxy"
```

---

### Task 4: Исправить retry логику

Retry в Task 3 имеет баг — при retry нужно использовать свежий `info`. Исправим:

**Files:**
- Modify: `server/src/routes/stream.ts`

**Step 1: Заменить `attempt` функцию на линейную retry логику**

В `server/src/routes/stream.ts` заменить весь обработчик роута (от `router.get` до конца) на:

```typescript
router.get("/:videoId", async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidVideoId(videoId)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  let info;
  try {
    info = await resolveAudioUrl(videoId);
  } catch (err: any) {
    console.error("resolveAudioUrl failed:", err.message);
    return res.status(500).json({ error: "Failed to resolve audio" });
  }

  const rangeHeader = req.headers.range;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { audioUrl, contentLength, contentType } = info;

    try {
      const fetchHeaders: Record<string, string> = {};
      if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

      const upstream = await fetch(audioUrl, { headers: fetchHeaders });

      if (upstream.status === 403 && attempt === 0) {
        invalidateCache(videoId);
        info = await resolveAudioUrl(videoId);
        continue;
      }

      if (!upstream.ok && upstream.status !== 206) {
        if (!res.headersSent) res.status(502).json({ error: "Upstream error" });
        return;
      }

      if (rangeHeader && contentLength > 0) {
        const range = parseRange(rangeHeader, contentLength);
        if (!range) {
          if (!res.headersSent) res.status(416).json({ error: "Range not satisfiable" });
          return;
        }
        const { start, end } = range;

        res.writeHead(206, {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
        });
      } else {
        res.writeHead(200, {
          "Content-Type": contentType,
          ...(contentLength > 0 ? { "Content-Length": String(contentLength) } : {}),
          "Accept-Ranges": "bytes",
        });
      }

      if (upstream.body) {
        const nodeStream = Readable.fromWeb(upstream.body as any);
        nodeStream.pipe(res);
        req.on("close", () => nodeStream.destroy());
      } else {
        res.end();
      }
      return;
    } catch (err: any) {
      if (attempt === 0) {
        invalidateCache(videoId);
        try { info = await resolveAudioUrl(videoId); continue; }
        catch { /* fall through */ }
      }
      console.error("Stream proxy error:", err.message);
      if (!res.headersSent) res.status(502).json({ error: "Stream proxy failed" });
      return;
    }
  }
});
```

**Step 2: Проверить TypeScript**

Run: `cd server && npx tsc --noEmit`
Expected: нет ошибок

**Step 3: Коммит**

```bash
git add server/src/routes/stream.ts
git commit -m "fix: simplify retry logic in stream route"
```

---

### Task 5: Ручная проверка

**Step 1: Запустить сервер**

Run: `cd server && npm run dev`

**Step 2: Проверить resolve через curl**

В другом терминале:
```bash
curl -v "http://localhost:3001/api/stream/dQw4w9WgXcQ" -o /dev/null 2>&1 | head -30
```
Expected: видим `Content-Type: audio/...`, `Content-Length: ...`, `Accept-Ranges: bytes`, статус 200

**Step 3: Проверить Range-запрос**

```bash
curl -v -H "Range: bytes=0-1023" "http://localhost:3001/api/stream/dQw4w9WgXcQ" -o /dev/null 2>&1 | head -30
```
Expected: статус 206, `Content-Range: bytes 0-1023/...`

**Step 4: Проверить в браузере**

Открыть приложение, найти трек, кликнуть — музыка должна играть, таймер двигаться, seek работать.

**Step 5: Запустить все тесты**

Run: `cd server && npx vitest run && cd ../client && npx vitest run`
Expected: все PASS

**Step 6: Коммит (если были правки)**

```bash
git add -A
git commit -m "fix: adjustments after manual testing"
```
