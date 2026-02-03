import { Router } from "express";
import { searchYouTube, parseYouTubeUrl, getVideoInfo } from "../services/youtube";

const router = Router();

router.get("/", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const videoId = parseYouTubeUrl(query);

    if (videoId) {
      const track = await getVideoInfo(videoId);
      return res.json({ tracks: [track] });
    }

    const results = await searchYouTube(query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
