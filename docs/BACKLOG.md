# MusicPlay Backlog

> Приоритизация: **Must** (критично) > **Should** (важно) > **Could** (желательно)

---

## Must

### ~~#4 Bug: Не работает сортировка~~ DONE
- **Причина:** `appendSearchResults` не дедуплицировал треки → дубликаты `key` → React reconciliation ломался
- **Фикс:** `client/src/stores/player.ts` — фильтр по `existingIds` при аппенде

### ~~#1 Push в GitHub + CI/CD на сервер~~ DONE
- **Фикс:** GitHub Actions → Docker build → GHCR → SSH deploy на VPS (5.180.82.187). Caddy reverse proxy + auto-HTTPS на music.tracker.ru

---

## Should

### ~~#7 Курсор на прогресс-баре плеера~~ DONE
- **Фикс:** `slider.tsx` — cursor-pointer на track, cursor-grab/active:cursor-grabbing на thumb

### ~~#5 Формат времени + кнопка повтора~~ DONE
- **Фикс:** `formatTime` поддерживает часы (1:23:45); кнопка Repeat1 в Player и FullscreenPlayer; repeatMode в zustand store; repeat-логика в useAudio

### ~~#6 Кнопка "В очередь" без дополнительного меню~~ DONE
- **Фикс:** Отдельная кнопка ListPlus рядом с ⋮; в dropdown только "В плейлист"

### ~~#3 Значок проигрывания текущей композиции~~ DONE
- **Фикс:** Volume2/Pause иконки вместо thumbnail для текущего трека в TrackList, PlaylistDetail (Queue уже имел)

---

## Could

### ~~#8 Автовоспроизведение результатов поиска~~ ОТМЕНЕНА

### ~~#2 Приложение для Android (PWA)~~ DONE
- **Фикс:** PWA (manifest + service worker)

### ~~#9 Мультиязычность (i18n)~~ DONE
- **Фикс:** Легковесный i18n на React Context + JSON. Языки: ru, kk, en. Автоопределение по браузеру + ручной переключатель (Globe + код языка) на странице логина и в хедере. Типизированные ключи, плюрализация. Дизайн в `design/main-layout.pen`, план в `docs/plans/2026-02-06-i18n-design.md`
