const API_BASE = "/api";

export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  viewCount: number;
  likeCount: number;
}

export interface SearchResult {
  tracks: Track[];
  nextPageToken?: string;
}

export async function searchTracks(query: string, pageToken?: string): Promise<SearchResult> {
  let url = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
  if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_BASE}/search/suggest?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  return res.json();
}

export function getStreamUrl(videoId: string): string {
  return `${API_BASE}/stream/${videoId}`;
}
