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
  const rows = db
    .prepare("SELECT id as _rowId, video_id, title, artist, thumbnail, duration, position FROM playlist_tracks WHERE playlist_id = ? ORDER BY position")
    .all(req.params.id) as any[];
  const tracks = rows.map((row) => ({
    id: row.video_id,
    title: row.title,
    artist: row.artist,
    thumbnail: row.thumbnail,
    duration: row.duration,
    _rowId: row._rowId,
  }));
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
