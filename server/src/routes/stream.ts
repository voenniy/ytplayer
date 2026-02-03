import { Router } from "express";
import { getAudioStream } from "../services/audio";

const router = Router();

router.get("/:videoId", (req, res) => {
  const { videoId } = req.params;

  if (!videoId || videoId.length !== 11) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  res.setHeader("Content-Type", "audio/webm");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  const stream = getAudioStream(videoId);

  stream.pipe(res);

  stream.on("error", (err) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Stream failed" });
    }
  });

  req.on("close", () => {
    stream.destroy();
  });
});

export default router;
