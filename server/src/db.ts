import Database from "better-sqlite3";

let db: Database.Database;

export function initDb(path: string = "./musicplay.db"): void {
  db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

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
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      position INTEGER NOT NULL,
      added_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Миграция: добавить колонки если таблица уже существует без них
  const columns = db.prepare("PRAGMA table_info(playlist_tracks)").all() as any[];
  const colNames = new Set(columns.map((c: any) => c.name));
  if (!colNames.has("view_count")) {
    db.exec("ALTER TABLE playlist_tracks ADD COLUMN view_count INTEGER DEFAULT 0");
  }
  if (!colNames.has("like_count")) {
    db.exec("ALTER TABLE playlist_tracks ADD COLUMN like_count INTEGER DEFAULT 0");
  }
}

export function getDb(): Database.Database {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");
  return db;
}
