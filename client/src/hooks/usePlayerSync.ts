import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/player";
import { fetchPlayerState, savePlayerState } from "@/lib/player-state-api";

export function usePlayerSync() {
  const syncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  // Load state from server on mount
  useEffect(() => {
    // Clean up legacy localStorage persistence (now server-only)
    localStorage.removeItem("musicplay-player");

    fetchPlayerState()
      .then((state) => {
        if (state.queue.length > 0 || state.currentTrack) {
          usePlayerStore.setState({
            queue: state.queue,
            currentIndex: state.currentIndex,
            currentTrack: state.currentTrack ?? state.queue[state.currentIndex] ?? null,
            repeatMode: state.repeatMode,
          });
          localStorage.setItem("musicplay-position", String(state.position));
        }
      })
      .catch((err) => console.error("Failed to load player state:", err));
  }, []);

  const syncToServer = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const { queue, currentIndex, repeatMode, currentTrack } = usePlayerStore.getState();
    const posStr = localStorage.getItem("musicplay-position");
    const position = posStr ? parseFloat(posStr) : 0;

    savePlayerState({ queue, currentIndex, position, repeatMode, currentTrack })
      .catch((err) => console.error("Failed to sync player state:", err))
      .finally(() => {
        syncingRef.current = false;
        lastSyncRef.current = Date.now();
      });
  }, []);

  // Periodic sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(syncToServer, 30_000);
    return () => clearInterval(interval);
  }, [syncToServer]);

  // Sync on visibility change (tab hide / app background)
  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === "hidden") syncToServer();
    };
    const onBeforeUnload = () => syncToServer();

    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [syncToServer]);

  // Sync on store changes (queue, track, repeat)
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state, prev) => {
      const changed =
        state.currentIndex !== prev.currentIndex ||
        state.queue.length !== prev.queue.length ||
        state.repeatMode !== prev.repeatMode ||
        state.currentTrack?.id !== prev.currentTrack?.id;

      if (changed && Date.now() - lastSyncRef.current > 2000) {
        syncToServer();
      }
    });
    return unsub;
  }, [syncToServer]);

  return { syncToServer };
}
