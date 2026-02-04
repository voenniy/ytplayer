import { Router } from "express";
import { Readable } from "stream";
import { isValidVideoId, resolveAudioUrl, invalidateCache } from "../services/audio";

const router = Router();

function parseRange(header: string, total: number): { start: number; end: number } | null {
  const match = header.match(/bytes=(\d+)-(\d*)/);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : total - 1;
  if (start >= total || end >= total || start > end) return null;
  return { start, end };
}

router.get("/:videoId", async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidVideoId(videoId)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  let audioInfo;
  try {
    audioInfo = await resolveAudioUrl(videoId);
  } catch (err) {
    console.error("Failed to resolve audio URL:", err);
    return res.status(502).json({ error: "Failed to resolve audio" });
  }

  let { audioUrl, contentLength, contentType } = audioInfo;

  const rangeHeader = req.headers.range;
  const range = rangeHeader
    ? parseRange(rangeHeader, contentLength)
    : { start: 0, end: contentLength - 1 };

  if (!range) {
    return res.status(416).json({ error: "Range not satisfiable" });
  }

  const { start, end } = range;
  const MAX_ATTEMPTS = 2;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let upstream: Response;
    try {
      upstream = await fetch(audioUrl, {
        headers: { Range: `bytes=${start}-${end}` },
      });
    } catch (err) {
      console.error("Upstream fetch failed:", err);
      return res.status(502).json({ error: "Upstream fetch failed" });
    }

    if (upstream.status === 403 && attempt === 0) {
      invalidateCache(videoId);
      try {
        const fresh = await resolveAudioUrl(videoId);
        audioUrl = fresh.audioUrl;
        contentLength = fresh.contentLength;
        contentType = fresh.contentType;
      } catch (err) {
        console.error("Failed to re-resolve audio URL:", err);
        return res.status(502).json({ error: "Failed to resolve audio" });
      }
      continue;
    }

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(502).json({ error: `Upstream returned ${upstream.status}` });
    }

    res.status(206);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Range", `bytes ${start}-${end}/${contentLength}`);
    res.setHeader("Content-Length", end - start + 1);

    if (!upstream.body) {
      return res.end();
    }

    const nodeStream = Readable.fromWeb(upstream.body as any);
    nodeStream.pipe(res);

    req.on("close", () => {
      nodeStream.destroy();
    });

    return;
  }

  return res.status(502).json({ error: "Failed after retries" });
});

export default router;
