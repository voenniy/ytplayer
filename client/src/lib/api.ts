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

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.tracks;
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_BASE}/search/suggest?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

export function getStreamUrl(videoId: string): string {
  return `${API_BASE}/stream/${videoId}`;
}
