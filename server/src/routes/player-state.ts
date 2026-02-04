import { Router } from "express";
import { getDb } from "../db";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

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
