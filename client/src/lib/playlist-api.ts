import type { Track } from "./api";

const API_BASE = "/api";

export interface Playlist {
  id: number;
  name: string;
  created_at: string;
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await fetch(`${API_BASE}/playlists`);
  if (!res.ok) throw new Error("Failed to fetch playlists");
  return res.json();
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const res = await fetch(`${API_BASE}/playlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create playlist");
  return res.json();
}

export async function deletePlaylist(id: number): Promise<void> {
  await fetch(`${API_BASE}/playlists/${id}`, { method: "DELETE" });
}

export async function fetchPlaylistTracks(playlistId: number): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`);
  if (!res.ok) throw new Error("Failed to fetch playlist tracks");
  return res.json();
}

export async function addTrackToPlaylist(playlistId: number, track: Track): Promise<void> {
  await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      duration: track.duration,
    }),
  });
}

export async function removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<void> {
  await fetch(`${API_BASE}/playlists/${playlistId}/tracks/${trackId}`, { method: "DELETE" });
}
