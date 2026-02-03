# Range-proxy аудиостриминг

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Заменить chunked-стриминг через yt-dlp stdout на Range-proxy к прямым URL аудиодорожек YouTube CDN.

**Проблема:** Текущий подход (`yt-dlp -o - | pipe`) отдаёт chunked поток без Content-Length и Range — браузерный `<audio>` не может определить duration, seek не работает, воспроизведение не стартует.

**Решение:** Сервер через `yt-dlp --dump-json` получает прямой URL аудиодорожки и её размер, затем проксирует Range-запросы браузера к YouTube CDN.

## Архитектура

```
Browser <audio>
  │
  ├─ GET /api/stream/:videoId          (без Range → 200 + полный поток)
  ├─ GET /api/stream/:videoId           (Range: bytes=X-Y → 206 Partial)
  │
  └──► Express route (stream.ts)
        │
        ├─ resolveAudioUrl(videoId)     (audio.ts)
        │   ├─ Кэш hit → {url, contentLength, contentType}
        │   └─ Кэш miss → yt-dlp --dump-json → парсинг → кэш
        │
        └─ fetch(audioUrl, { Range }) → pipe → res
```

## Файлы

### `server/src/services/audio.ts` — полная переработка

**resolveAudioUrl(videoId):**
1. Проверить in-memory кэш (`Map<videoId, CacheEntry>`)
2. Если нет/протух — `spawn("yt-dlp", ["--dump-json", "--no-warnings", url])`
3. Собрать stdout в строку, JSON.parse
4. Из `formats` выбрать лучший аудиоформат:
   - Фильтр: `vcodec === "none"` (только аудио)
   - Сортировка: по `abr` desc
   - Первый результат
5. Извлечь: `url`, `filesize` (или `filesize_approx`), `ext`
6. Content-Type по ext: webm → `audio/webm`, m4a → `audio/mp4`, ogg → `audio/ogg`
7. Положить в кэш, TTL 4 часа

**Кэш:**
```typescript
interface CacheEntry {
  audioUrl: string;
  contentLength: number;
  contentType: string;
  expiresAt: number; // Date.now() + 4 * 60 * 60 * 1000
}

const cache = new Map<string, CacheEntry>();
```
Очистка ленивая — при обращении проверяем expiresAt.

### `server/src/routes/stream.ts` — Range-proxy

1. `resolveAudioUrl(videoId)` → получаем audioUrl + contentLength + contentType
2. Парсим `Range` заголовок клиента
3. Без Range:
   - 200, Content-Type, Content-Length, Accept-Ranges: bytes
   - `fetch(audioUrl)` → pipe → res
4. С Range (`bytes=START-END`):
   - END может отсутствовать → `contentLength - 1`
   - 206 Partial Content
   - Content-Range: `bytes START-END/TOTAL`
   - Content-Length: `END - START + 1`
   - `fetch(audioUrl, { headers: { Range } })` → pipe → res
5. При 403/ошибке fetch — сбросить кэш, один retry
6. `req.on("close")` → abort fetch

### Фронтенд — без изменений

`useAudio.ts`, `api.ts` — не трогаем. Браузер сам управляет Range-запросами к `/api/stream/:videoId`.

## Зависимости

- Встроенный `fetch` (Node 18+) — без новых пакетов
- `yt-dlp` — уже установлен
