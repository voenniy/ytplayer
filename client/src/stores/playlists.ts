import { create } from "zustand";
import type { Track } from "@/lib/api";
import type { Playlist } from "@/lib/playlist-api";
import * as api from "@/lib/playlist-api";

interface PlaylistsState {
  playlists: Playlist[];
  activePlaylistId: number | null;
  activePlaylistTracks: Track[];

  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (id: number) => Promise<void>;
  selectPlaylist: (id: number | null) => Promise<void>;
  addTrack: (playlistId: number, track: Track) => Promise<void>;
  removeTrack: (playlistId: number, trackId: number) => Promise<void>;
}

export const usePlaylistsStore = create<PlaylistsState>((set, get) => ({
  playlists: [],
  activePlaylistId: null,
  activePlaylistTracks: [],

  loadPlaylists: async () => {
    const playlists = await api.fetchPlaylists();
    set({ playlists });
  },

  createPlaylist: async (name) => {
    await api.createPlaylist(name);
    await get().loadPlaylists();
  },

  deletePlaylist: async (id) => {
    await api.deletePlaylist(id);
    const { activePlaylistId } = get();
    if (activePlaylistId === id) {
      set({ activePlaylistId: null, activePlaylistTracks: [] });
    }
    await get().loadPlaylists();
  },

  selectPlaylist: async (id) => {
    if (id === null) {
      set({ activePlaylistId: null, activePlaylistTracks: [] });
      return;
    }
    const tracks = await api.fetchPlaylistTracks(id);
    set({ activePlaylistId: id, activePlaylistTracks: tracks });
  },

  addTrack: async (playlistId, track) => {
    await api.addTrackToPlaylist(playlistId, track);
    const { activePlaylistId } = get();
    if (activePlaylistId === playlistId) {
      await get().selectPlaylist(playlistId);
    }
  },

  removeTrack: async (playlistId, trackId) => {
    await api.removeTrackFromPlaylist(playlistId, trackId);
    const { activePlaylistId } = get();
    if (activePlaylistId === playlistId) {
      await get().selectPlaylist(playlistId);
    }
  },
}));
