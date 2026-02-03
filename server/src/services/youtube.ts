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

export async function searchYouTube(query: string, pageToken?: string): Promise<SearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10"); // Music
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("key", apiKey);
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json();
  const videoIds = data.items.map((item: any) => item.id.videoId as string);

  // Batch-запрос к Videos API за duration, viewCount, likeCount
  const detailsMap = await fetchVideoDetails(apiKey, videoIds);

  const tracks: Track[] = data.items.map((item: any) => {
    const details = detailsMap.get(item.id.videoId);
    return {
      id: item.id.videoId,
      title: decodeHtmlEntities(item.snippet.title),
      artist: decodeHtmlEntities(item.snippet.channelTitle),
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: details?.duration ?? 0,
      viewCount: details?.viewCount ?? 0,
      likeCount: details?.likeCount ?? 0,
    };
  });

  return { tracks, nextPageToken: data.nextPageToken };
}

interface VideoDetails {
  duration: number;
  viewCount: number;
  likeCount: number;
}

async function fetchVideoDetails(
  apiKey: string,
  videoIds: string[],
): Promise<Map<string, VideoDetails>> {
  if (videoIds.length === 0) return new Map();

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails,statistics");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube Videos API error: ${res.status}`);

  const data = await res.json();
  const map = new Map<string, VideoDetails>();

  for (const item of data.items) {
    map.set(item.id, {
      duration: parseDuration(item.contentDetails.duration),
      viewCount: parseInt(item.statistics.viewCount || "0"),
      likeCount: parseInt(item.statistics.likeCount || "0"),
    });
  }

  return map;
}

export async function getVideoInfo(videoId: string): Promise<Track> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json();
  const item = data.items[0];
  if (!item) throw new Error(`Video not found: ${videoId}`);

  return {
    id: videoId,
    title: decodeHtmlEntities(item.snippet.title),
    artist: decodeHtmlEntities(item.snippet.channelTitle),
    thumbnail: item.snippet.thumbnails.medium.url,
    duration: parseDuration(item.contentDetails.duration),
    viewCount: parseInt(item.statistics.viewCount || "0"),
    likeCount: parseInt(item.statistics.likeCount || "0"),
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

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(?:#39|#x27|amp|lt|gt|quot|apos);/g, (match) => HTML_ENTITIES[match] ?? match);
}
