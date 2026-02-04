# MusicPlay Backlog

> Приоритизация: **Must** (критично) > **Should** (важно) > **Could** (желательно)

---

## Must

### ~~#4 Bug: Не работает сортировка~~ DONE
- **Причина:** `appendSearchResults` не дедуплицировал треки → дубликаты `key` → React reconciliation ломался
- **Фикс:** `client/src/stores/player.ts` — фильтр по `existingIds` при аппенде

### #1 Push в GitHub + CI/CD на сервер
- **Тип:** DevOps
- **Описание:** Настроить деплой: push в GitHub, автоматический деплой на сервер
- **Вопросы:** Какой сервер? VPS/Docker? Домен?

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

### #8 Автовоспроизведение результатов поиска
- **Тип:** Фича
- **Описание:** При клике на трек из результатов поиска — автоматически добавлять все результаты в очередь и воспроизводить последовательно (как плейлист)

### #2 Приложение для Android (PWA)
- **Тип:** Фича
- **Описание:** Отдельное приложение для Android. Варианты: PWA (manifest + service worker), Capacitor, или TWA (Trusted Web Activity)
- **Зависимости:** #1 (нужен деплой на сервер с HTTPS)
- **Вопросы:** PWA vs нативная обёртка?
