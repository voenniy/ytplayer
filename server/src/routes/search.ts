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

    const pageToken = req.query.pageToken as string | undefined;
    const results = await searchYouTube(query, pageToken);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/suggest", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.json([]);
  }

  try {
    const url = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const text = await response.text();

    // JSONP response: window.google.ac.h([...])
    const match = text.match(/\[.+\]/s);
    if (!match) {
      return res.json([]);
    }

    const parsed = JSON.parse(match[0]);
    const suggestions: string[] = parsed[1]?.map((item: any[]) => item[0]) ?? [];
    res.json(suggestions);
  } catch {
    res.json([]);
  }
});

export default router;
