import { create } from "zustand";
import type { Track } from "@/lib/api";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  searchResults: Track[];

  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  playNext: () => void;
  setSearchResults: (tracks: Track[]) => void;
  clearQueue: () => void;
  shuffle: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  searchResults: [],

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
  setSearchResults: (tracks) => set({ searchResults: tracks }),
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
