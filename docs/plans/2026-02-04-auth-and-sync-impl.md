# Auth & Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add email/password authentication and cross-device player state sync to MusicPlay.

**Architecture:** JWT auth in httpOnly cookies, bcrypt password hashing, SQLite tables for users and player state. Auth middleware protects all API routes. Client syncs player state every 30 seconds + on user actions.

**Tech Stack:** bcryptjs, jsonwebtoken, cookie-parser (server); React context for auth state (client)

---

## Task 1: Install server auth dependencies

**Files:**
- Modify: `server/package.json`

**Step 1: Install packages**

Run:
```bash
cd server && npm install bcryptjs jsonwebtoken cookie-parser && npm install -D @types/bcryptjs @types/jsonwebtoken @types/cookie-parser
```

**Step 2: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: add auth dependencies (bcryptjs, jsonwebtoken, cookie-parser)"
```

---

## Task 2: Add users table and player_state table to DB

**Files:**
- Modify: `server/src/db.ts:10-30`

**Step 1: Add tables to initDb**

In `server/src/db.ts`, append to the `db.exec(...)` block (after the `playlist_tracks` table):

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS player_state (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  queue TEXT NOT NULL DEFAULT '[]',
  current_index INTEGER NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  repeat_mode TEXT NOT NULL DEFAULT 'off',
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Step 2: Add playlists.user_id migration**

After the existing `like_count` migration block (line ~40), add:

```typescript
if (!colNames.has("user_id")) {
  db.exec("ALTER TABLE playlists ADD COLUMN user_id INTEGER REFERENCES users(id)");
}
```

Note: reuse the existing `colNames` set from `PRAGMA table_info(playlist_tracks)` — but we need a separate pragma for `playlists`. Add:

```typescript
const playlistCols = db.prepare("PRAGMA table_info(playlists)").all() as any[];
const playlistColNames = new Set(playlistCols.map((c: any) => c.name));
if (!playlistColNames.has("user_id")) {
  db.exec("ALTER TABLE playlists ADD COLUMN user_id INTEGER REFERENCES users(id)");
}
```

**Step 3: Commit**

```bash
git add server/src/db.ts
git commit -m "feat: add users, player_state tables and playlists.user_id migration"
```

---

## Task 3: Create auth middleware

**Files:**
- Create: `server/src/middleware/auth.ts`

**Step 1: Create the middleware**

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "musicplay-dev-secret";
const COOKIE_NAME = "musicplay_token";
const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

export interface AuthRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = payload.userId;

    // Sliding expiration: refresh cookie on every request
    const newToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: "365d" });
    res.cookie(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
    });

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export { JWT_SECRET, COOKIE_NAME, MAX_AGE };
```

**Step 2: Commit**

```bash
git add server/src/middleware/auth.ts
git commit -m "feat: add JWT auth middleware with sliding expiration"
```

---

## Task 4: Create auth routes (login, logout, me)

**Files:**
- Create: `server/src/routes/auth.ts`

**Step 1: Create auth router**

```typescript
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { requireAuth, JWT_SECRET, COOKIE_NAME, MAX_AGE, type AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const db = getDb();
  const user = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(email) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "365d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
  });

  res.json({ id: user.id, email: user.email });
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(req.userId) as any;
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email });
});

export default router;
```

**Step 2: Commit**

```bash
git add server/src/routes/auth.ts
git commit -m "feat: add auth routes (login, logout, me)"
```

---

## Task 5: Create player state routes

**Files:**
- Create: `server/src/routes/player-state.ts`

**Step 1: Create player state router**

```typescript
import { Router } from "express";
import { getDb } from "../db";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /api/player/state
router.get("/state", (req: AuthRequest, res) => {
  const db = getDb();
  const state = db.prepare("SELECT * FROM player_state WHERE user_id = ?").get(req.userId) as any;

  if (!state) {
    res.json({ queue: [], currentIndex: 0, position: 0, repeatMode: "off" });
    return;
  }

  res.json({
    queue: JSON.parse(state.queue),
    currentIndex: state.current_index,
    position: state.position,
    repeatMode: state.repeat_mode,
    updatedAt: state.updated_at,
  });
});

// PUT /api/player/state
router.put("/state", (req: AuthRequest, res) => {
  const { queue, currentIndex, position, repeatMode } = req.body;
  const db = getDb();

  db.prepare(`
    INSERT INTO player_state (user_id, queue, current_index, position, repeat_mode, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      queue = excluded.queue,
      current_index = excluded.current_index,
      position = excluded.position,
      repeat_mode = excluded.repeat_mode,
      updated_at = excluded.updated_at
  `).run(
    req.userId,
    JSON.stringify(queue || []),
    currentIndex ?? 0,
    position ?? 0,
    repeatMode || "off",
  );

  res.json({ ok: true });
});

export default router;
```

**Step 2: Commit**

```bash
git add server/src/routes/player-state.ts
git commit -m "feat: add player state sync routes (GET/PUT)"
```

---

## Task 6: Wire everything into server index.ts

**Files:**
- Modify: `server/src/index.ts`

**Step 1: Update index.ts**

Replace the full content with:

```typescript
import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import searchRouter from "./routes/search";
import streamRouter from "./routes/stream";
import playlistsRouter from "./routes/playlists";
import authRouter from "./routes/auth";
import playerStateRouter from "./routes/player-state";
import { initDb } from "./db";
import { requireAuth } from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

initDb();

// Public routes
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/search", requireAuth, searchRouter);
app.use("/api/stream", requireAuth, streamRouter);
app.use("/api/playlists", requireAuth, playlistsRouter);
app.use("/api/player", requireAuth, playerStateRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve client static files in production
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));
app.get("{*path}", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

Key changes:
- Add `cookieParser` middleware
- Add `cors` with `credentials: true`
- Auth routes are public (no middleware)
- All other API routes are protected with `requireAuth`
- `requireAuth` is applied at mount level (not inside each router)

**Step 2: Remove duplicate requireAuth from player-state.ts**

Since `requireAuth` is applied at mount level in index.ts, remove `router.use(requireAuth)` from `server/src/routes/player-state.ts` (line 6). Keep the `AuthRequest` type import.

**Step 3: Update playlists router to filter by user_id**

Modify `server/src/routes/playlists.ts`:

- Add import: `import { type AuthRequest } from "../middleware/auth";`
- GET `/` — filter by `req.userId`: `WHERE user_id = ?`
- POST `/` — insert with `user_id`: add `req.userId` to INSERT
- DELETE `/:id` — add `AND user_id = ?` check
- GET `/:id/tracks` — verify playlist belongs to user before returning tracks
- POST `/:id/tracks` — verify playlist belongs to user
- PUT `/:id/tracks/reorder` — verify playlist belongs to user
- DELETE `/:playlistId/tracks/:trackId` — verify playlist belongs to user

Add helper to verify ownership:

```typescript
function verifyPlaylistOwner(db: any, playlistId: string, userId: number): boolean {
  const playlist = db.prepare("SELECT id FROM playlists WHERE id = ? AND user_id = ?").get(playlistId, userId);
  return !!playlist;
}
```

**Step 4: Commit**

```bash
git add server/src/index.ts server/src/routes/playlists.ts server/src/routes/player-state.ts
git commit -m "feat: wire auth middleware, protect all routes, filter playlists by user"
```

---

## Task 7: Create CLI script for user creation

**Files:**
- Create: `server/src/create-user.ts`
- Modify: `server/package.json` (add script)

**Step 1: Create the script**

```typescript
import { initDb, getDb } from "./db";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const args = process.argv.slice(2);
const emailIdx = args.indexOf("--email");
const passwordIdx = args.indexOf("--password");

if (emailIdx === -1 || passwordIdx === -1) {
  console.error("Usage: npm run create-user -- --email user@example.com --password mypassword");
  process.exit(1);
}

const email = args[emailIdx + 1];
const password = args[passwordIdx + 1];

if (!email || !password) {
  console.error("Email and password are required");
  process.exit(1);
}

initDb();
const db = getDb();

const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
if (existing) {
  console.error(`User with email ${email} already exists`);
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const result = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, hash);
console.log(`User created: ${email} (id: ${result.lastInsertRowid})`);
```

**Step 2: Add npm script**

Add to `server/package.json` scripts:

```json
"create-user": "tsx src/create-user.ts"
```

**Step 3: Commit**

```bash
git add server/src/create-user.ts server/package.json
git commit -m "feat: add CLI script for creating users"
```

---

## Task 8: Create auth API client on frontend

**Files:**
- Create: `client/src/lib/auth-api.ts`

**Step 1: Create auth API functions**

```typescript
const API_BASE = "/api";

export interface User {
  id: number;
  email: string;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Login failed");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getMe(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  return res.json();
}
```

**Step 2: Add `credentials: "include"` to all existing fetch calls**

Modify `client/src/lib/api.ts` — add `{ credentials: "include" }` to `searchTracks` and `fetchSuggestions`.

Modify `client/src/lib/playlist-api.ts` — add `credentials: "include"` to all fetch calls.

**Step 3: Commit**

```bash
git add client/src/lib/auth-api.ts client/src/lib/api.ts client/src/lib/playlist-api.ts
git commit -m "feat: add auth API client, add credentials to all fetch calls"
```

---

## Task 9: Create player state sync API client

**Files:**
- Create: `client/src/lib/player-state-api.ts`

**Step 1: Create sync API**

```typescript
import type { Track } from "./api";

const API_BASE = "/api";

export interface PlayerStateData {
  queue: Track[];
  currentIndex: number;
  position: number;
  repeatMode: "off" | "one";
  updatedAt?: string;
}

export async function fetchPlayerState(): Promise<PlayerStateData> {
  const res = await fetch(`${API_BASE}/player/state`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch player state");
  return res.json();
}

export async function savePlayerState(state: Omit<PlayerStateData, "updatedAt">): Promise<void> {
  await fetch(`${API_BASE}/player/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(state),
  });
}
```

**Step 2: Commit**

```bash
git add client/src/lib/player-state-api.ts
git commit -m "feat: add player state sync API client"
```

---

## Task 10: Create AuthProvider and LoginPage

**Files:**
- Create: `client/src/contexts/AuthContext.tsx`
- Create: `client/src/components/LoginPage.tsx`

**Step 1: Create AuthContext**

```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getMe, login as apiLogin, logout as apiLogout, type User } from "@/lib/auth-api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await apiLogin(email, password);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

**Step 2: Create LoginPage**

```tsx
import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError("Неверный email или пароль");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">MusicPlay</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Вход..." : "Войти"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/contexts/AuthContext.tsx client/src/components/LoginPage.tsx
git commit -m "feat: add AuthProvider context and LoginPage component"
```

---

## Task 11: Wire auth into App.tsx and add logout

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/Layout.tsx`
- Modify: `client/src/main.tsx` (if exists) — wrap with AuthProvider

**Step 1: Wrap app with AuthProvider**

In entry point (likely `client/src/main.tsx`), wrap `<App />` with `<AuthProvider>`.

**Step 2: Add auth gate to App.tsx**

At the top of the `App` component:

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";

// Inside App():
const { user, isLoading } = useAuth();

if (isLoading) {
  return <div className="h-screen bg-background flex items-center justify-center">
    <p className="text-muted-foreground">Загрузка...</p>
  </div>;
}

if (!user) return <LoginPage />;
```

**Step 3: Add logout button to Layout header**

In `client/src/components/Layout.tsx`, add a logout button in the header:

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

// Inside Layout:
const { logout } = useAuth();

// In header, next to h1:
<button onClick={logout} className="text-muted-foreground hover:text-foreground" title="Выйти">
  <LogOut className="h-5 w-5" />
</button>
```

**Step 4: Commit**

```bash
git add client/src/App.tsx client/src/components/Layout.tsx client/src/main.tsx
git commit -m "feat: wire auth into app, add login gate and logout button"
```

---

## Task 12: Add player state sync hook

**Files:**
- Create: `client/src/hooks/usePlayerSync.ts`

**Step 1: Create the sync hook**

```typescript
import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/player";
import { fetchPlayerState, savePlayerState } from "@/lib/player-state-api";

export function usePlayerSync() {
  const syncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  // Load state from server on mount
  useEffect(() => {
    fetchPlayerState()
      .then((state) => {
        if (state.queue.length > 0) {
          const store = usePlayerStore.getState();
          // Server state takes priority if it has data
          store.setSearchResults(store.searchResults, store.nextPageToken ?? undefined);
          usePlayerStore.setState({
            queue: state.queue,
            currentIndex: state.currentIndex,
            currentTrack: state.queue[state.currentIndex] || null,
            repeatMode: state.repeatMode,
          });
          // Position will be restored by App.tsx via localStorage fallback
          localStorage.setItem("musicplay-position", String(state.position));
        }
      })
      .catch((err) => console.error("Failed to load player state:", err));
  }, []);

  const syncToServer = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const { queue, currentIndex, repeatMode } = usePlayerStore.getState();
    const posStr = localStorage.getItem("musicplay-position");
    const position = posStr ? parseFloat(posStr) : 0;

    savePlayerState({ queue, currentIndex, position, repeatMode })
      .catch((err) => console.error("Failed to sync player state:", err))
      .finally(() => {
        syncingRef.current = false;
        lastSyncRef.current = Date.now();
      });
  }, []);

  // Periodic sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(syncToServer, 30_000);
    return () => clearInterval(interval);
  }, [syncToServer]);

  // Sync on visibility change (tab hide / app background)
  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === "hidden") syncToServer();
    };
    const onBeforeUnload = () => syncToServer();

    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [syncToServer]);

  // Sync on store changes (queue, track, repeat changes)
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state, prev) => {
      const changed =
        state.currentIndex !== prev.currentIndex ||
        state.queue.length !== prev.queue.length ||
        state.repeatMode !== prev.repeatMode ||
        state.currentTrack?.id !== prev.currentTrack?.id;

      if (changed && Date.now() - lastSyncRef.current > 2000) {
        syncToServer();
      }
    });
    return unsub;
  }, [syncToServer]);

  return { syncToServer };
}
```

**Step 2: Wire into App.tsx**

Add to the `App` component (after auth check, before return):

```tsx
import { usePlayerSync } from "@/hooks/usePlayerSync";

// Inside App, after auth gate:
const { syncToServer } = usePlayerSync();
```

Also call `syncToServer()` in `handlePlayPause` when pausing:

```tsx
const handlePlayPause = useCallback(() => {
  if (storeIsPlaying) {
    audio.pause();
    storePause();
    syncToServer();
  } else {
    audio.resume();
    storeResume();
  }
}, [storeIsPlaying, audio, storePause, storeResume, syncToServer]);
```

**Step 3: Commit**

```bash
git add client/src/hooks/usePlayerSync.ts client/src/App.tsx
git commit -m "feat: add player state sync hook with 30s interval + event triggers"
```

---

## Task 13: Update Vite dev proxy for cookies

**Files:**
- Modify: `client/vite.config.ts`

**Step 1: Ensure proxy passes cookies**

Check that the Vite dev proxy config has `changeOrigin: true`. Cookies should work by default since the proxy runs on the same origin. No changes needed if proxy is already configured for `/api`.

If the proxy is missing cookie handling, add:

```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
  },
},
```

**Step 2: Commit (if changes needed)**

```bash
git add client/vite.config.ts
git commit -m "fix: ensure vite proxy forwards cookies correctly"
```

---

## Task 14: Add JWT_SECRET to deployment config

**Files:**
- Modify: `deploy/docker-compose.yml`
- Create: `server/.env.example`

**Step 1: Add JWT_SECRET to docker-compose**

Add to the `app` service environment:

```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}
```

**Step 2: Create .env.example**

```
PORT=3001
DB_PATH=./musicplay.db
YOUTUBE_API_KEY=your_youtube_api_key
JWT_SECRET=change-this-to-a-random-secret
```

**Step 3: Commit**

```bash
git add deploy/docker-compose.yml server/.env.example
git commit -m "chore: add JWT_SECRET to deployment config and .env.example"
```

---

## Task 15: Manual testing and initial user creation

**Step 1: Start the dev server**

```bash
cd server && npm run dev
```

**Step 2: Create initial user**

```bash
cd server && npm run create-user -- --email voenniy@gmail.com --password <your-password>
```

**Step 3: Test auth flow**

1. Open browser → should see login page
2. Enter wrong credentials → should see error
3. Enter correct credentials → should see main app
4. Refresh page → should stay logged in
5. Click logout → should see login page

**Step 4: Test sync flow**

1. Log in, search and add tracks to queue
2. Wait 30 seconds (or pause playback)
3. Open in another browser / incognito → log in → should see same queue and position

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete auth and player state sync implementation"
```
