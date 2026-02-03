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
