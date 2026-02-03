import { create } from "zustand";
import type { Track } from "@/lib/api";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  searchResults: Track[];
  nextPageToken: string | null;

  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  playNext: () => void;
  setSearchResults: (tracks: Track[], nextPageToken?: string) => void;
  appendSearchResults: (tracks: Track[], nextPageToken?: string) => void;
  clearQueue: () => void;
  shuffle: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  searchResults: [],
  nextPageToken: null,

  play: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),
  removeFromQueue: (index) =>
    set((state) => ({
      queue: state.queue.filter((_, i) => i !== index),
    })),
  playNext: () => {
    const { queue } = get();
    if (queue.length === 0) {
      set({ currentTrack: null, isPlaying: false });
      return;
    }
    const [next, ...rest] = queue;
    set({ currentTrack: next, queue: rest, isPlaying: true });
  },
  setSearchResults: (tracks, nextPageToken) => set({ searchResults: tracks, nextPageToken: nextPageToken ?? null }),
  appendSearchResults: (tracks, nextPageToken) =>
    set((state) => ({ searchResults: [...state.searchResults, ...tracks], nextPageToken: nextPageToken ?? null })),
  clearQueue: () => set({ queue: [] }),
  shuffle: () =>
    set((state) => {
      const shuffled = [...state.queue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return { queue: shuffled };
    }),
}));
