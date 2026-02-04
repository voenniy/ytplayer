# Авторизация и синхронизация состояния

## Цель

Добавить авторизацию по email/паролю (без регистрации, только whitelist) и привязать все данные (плейлисты, очередь, позицию воспроизведения) к аккаунту пользователя для синхронизации между устройствами.

## Решения

| Вопрос | Решение |
|--------|---------|
| Хранение учётных данных | SQLite + bcrypt |
| Сессии | JWT в httpOnly cookie, 1 год, sliding expiration |
| Громкость | Локальная (не синхронизируется) |
| Частота сохранения позиции | 30 сек + при паузе/смене трека/изменении очереди |

---

## 1. Серверная часть — аутентификация

### Новая таблица `users`

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### API эндпоинты

```
POST /api/auth/login    — { email, password } → set httpOnly cookie с JWT
POST /api/auth/logout   — очистка cookie
GET  /api/auth/me       — текущий пользователь (id, email)
```

### Middleware `requireAuth`

- Проверяет JWT из cookie на каждом запросе к `/api/*` (кроме `/api/auth/login`)
- Невалидный/отсутствующий токен → 401
- Валидный → `req.userId` в handler, cookie продлевается (sliding expiration)

### Создание пользователя

CLI-команда: `npm run create-user -- --email voenniy@gmail.com --password xxx`

- Хеширует пароль bcrypt
- Вставляет в `users`
- Проверяет уникальность email

### Зависимости

- `bcrypt` — хеширование паролей
- `jsonwebtoken` — JWT
- `cookie-parser` — парсинг cookies в Express
- Env: `JWT_SECRET` — секрет для подписи токенов

---

## 2. Фронтенд — страница логина и защита

### Страница логина

- Простая форма: email + password + кнопка "Войти"
- При ошибке: "Неверный email или пароль"
- Стилистика: Tailwind + shadcn/ui, минимализм

### AuthProvider (React context)

```tsx
// При загрузке:
// GET /api/auth/me → 200? показать приложение : показать логин

// App.tsx
if (!user) return <LoginPage />
return <Layout>...</Layout>
```

### Логаут

Кнопка в header → `POST /api/auth/logout` → очистка cookie → показ логин-страницы.

---

## 3. Привязка данных к пользователю

### Миграция `playlists`

```sql
ALTER TABLE playlists ADD COLUMN user_id INTEGER REFERENCES users(id);
```

Все запросы к плейлистам фильтруются по `req.userId`.

### Новая таблица `player_state`

```sql
CREATE TABLE player_state (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  queue TEXT NOT NULL DEFAULT '[]',
  current_index INTEGER NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  repeat_mode TEXT NOT NULL DEFAULT 'off',
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### API эндпоинты

```
GET  /api/player/state    — загрузить состояние
PUT  /api/player/state    — сохранить состояние
```

---

## 4. Синхронизация на клиенте

### Загрузка состояния

При открытии приложения (после авторизации):
1. `GET /api/player/state`
2. Восстановить очередь, текущий трек, позицию, repeat mode

### Сохранение состояния

`PUT /api/player/state` вызывается:
- Каждые 30 секунд (таймер)
- При паузе
- При смене трека (playNext, playPrev, playFromQueue)
- При изменении очереди (addToQueue, removeFromQueue)
- При переключении repeat mode
- При закрытии/скрытии страницы (`beforeunload` / `visibilitychange`)

### Offline-режим

localStorage остаётся как кеш. Если сервер недоступен (offline PWA), работаем из localStorage. При восстановлении связи — синхронизируем на сервер.

### Конфликты

Last-write-wins по `updated_at`. Для 1-2 пользователей этого достаточно.

---

## 5. Порядок реализации

1. **Серверная auth**: таблица users, bcrypt, JWT, login/logout/me эндпоинты, middleware
2. **CLI create-user**: скрипт для создания пользователя
3. **Фронтенд auth**: AuthProvider, LoginPage, защита приложения, логаут
4. **Миграция плейлистов**: добавить user_id, обновить API-запросы
5. **Серверная синхронизация**: таблица player_state, GET/PUT эндпоинты
6. **Клиентская синхронизация**: загрузка/сохранение состояния, таймер, события
7. **Тестирование**: auth flow, синхронизация между устройствами, offline-режим
