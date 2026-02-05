# YouTube Search Cache Design

## Проблема

YouTube Data API квота: 10,000 units/day.
- `search.list` = 100 units
- `videos.list` = 1 unit (batch до 50 видео)

Один поиск = 101 unit. Максимум ~99 поисков в день — недостаточно даже для личного использования.

## Решение

Кешировать результаты `search.list` (videoIds) в SQLite. Метаданные (`videos.list`) не кешируем — 1 unit дёшево, зато всегда свежие лайки/просмотры.

**Экономия:** 100 из 101 units (99%) на каждый повторный запрос.

## Архитектура

### Схема БД

```sql
CREATE TABLE IF NOT EXISTS search_cache (
  query TEXT PRIMARY KEY,        -- нормализованный запрос (lowercase, trim)
  video_ids TEXT NOT NULL,       -- JSON: ["id1", "id2", ...]
  next_page_token TEXT,          -- для пагинации
  created_at INTEGER NOT NULL    -- unix timestamp
);

CREATE INDEX idx_search_cache_created_at ON search_cache(created_at);
```

### TTL

7 дней. Музыка не устаревает, результаты поиска актуальны долго.

### Нормализация запроса

```typescript
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}
```

`"  Jazz  Music "` → `"jazz music"`

## Поток данных

```
Поиск "Jazz"
  │
  ├─→ normalizeQuery("Jazz") → "jazz"
  │
  ├─→ SELECT FROM search_cache WHERE query = "jazz"
  │     │
  │     ├─ Есть и created_at > (now - 7 days)?
  │     │    └─→ Берём video_ids из кеша (0 units)
  │     │
  │     └─ Нет или устарел?
  │          └─→ YouTube search.list (100 units)
  │              └─→ INSERT/REPLACE в search_cache
  │
  └─→ YouTube videos.list(video_ids) (1 unit) — всегда свежий
        │
        └─→ Возвращаем треки с актуальными метаданными
```

## Файлы

| Файл | Изменение |
|------|-----------|
| `server/src/db/index.ts` | Новая таблица `search_cache` |
| `server/src/services/search-cache.ts` | **Новый:** функции работы с кешем |
| `server/src/services/youtube.ts` | Интеграция кеша в `searchYouTube()` |

## API кеша

```typescript
// server/src/services/search-cache.ts

interface CachedSearch {
  videoIds: string[];
  nextPageToken?: string;
}

// Получить из кеша (null если нет или устарел)
export function getCachedSearch(query: string): CachedSearch | null;

// Сохранить в кеш
export function cacheSearch(query: string, videoIds: string[], nextPageToken?: string): void;

// Удалить устаревшие записи (старше 7 дней)
export function cleanExpiredCache(): void;
```

## Интеграция в youtube.ts

```typescript
export async function searchYouTube(query: string, pageToken?: string): Promise<SearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const normalizedQuery = normalizeQuery(query);
  let videoIds: string[];
  let nextPageToken: string | undefined;

  // Кеш только для первой страницы
  if (!pageToken) {
    const cached = getCachedSearch(normalizedQuery);
    if (cached) {
      log.info({ query: normalizedQuery, cached: true }, "search cache hit");
      videoIds = cached.videoIds;
      nextPageToken = cached.nextPageToken;
    }
  }

  // Если не из кеша — запрос к API
  if (!videoIds) {
    log.info({ query, pageToken: pageToken || null, cost: 100 }, "search request");
    const result = await youtubeSearchApi(query, pageToken);
    videoIds = result.videoIds;
    nextPageToken = result.nextPageToken;

    // Сохраняем в кеш (только первую страницу)
    if (!pageToken) {
      cacheSearch(normalizedQuery, videoIds, nextPageToken);
    }
  }

  // Метаданные всегда свежие (1 unit)
  const detailsMap = await fetchVideoDetails(apiKey, videoIds);

  // ... формируем и возвращаем треки
}
```

## Очистка

Вызывать `cleanExpiredCache()` при старте сервера в `index.ts`:

```typescript
import { cleanExpiredCache } from "./services/search-cache";

// При старте
cleanExpiredCache();
```

## Метрики

Добавить в логи для мониторинга:
- `search cache hit` — попадание в кеш
- `search cache miss` — промах, запрос к API
- Периодически логировать размер кеша
