import type { Track, SearchResult } from "../types";

const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export function parseYouTubeUrl(input: string): string | null {
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function searchYouTube(query: string): Promise<SearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10"); // Music
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json();

  const tracks: Track[] = data.items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration: 0,
  }));

  return { tracks, nextPageToken: data.nextPageToken };
}

export async function getVideoInfo(videoId: string): Promise<Track> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json();
  const item = data.items[0];
  if (!item) throw new Error(`Video not found: ${videoId}`);

  const duration = parseDuration(item.contentDetails.duration);

  return {
    id: videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration,
  };
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}
