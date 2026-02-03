const API_BASE = "/api";

export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.tracks;
}

export function getStreamUrl(videoId: string): string {
  return `${API_BASE}/stream/${videoId}`;
}
