import { useEffect } from "react";

interface UseMediaSessionOptions {
  title?: string;
  artist?: string;
  artwork?: string;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
}

export function useMediaSession({
  title,
  artist,
  artwork,
  isPlaying,
  onPlay,
  onPause,
  onNextTrack,
  onPreviousTrack,
}: UseMediaSessionOptions) {
  // Update metadata when track changes
  useEffect(() => {
    if (!("mediaSession" in navigator) || !title) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: artist || "",
      ...(artwork
        ? { artwork: [{ src: artwork.startsWith("/") ? `${location.origin}${artwork}` : artwork, sizes: "512x512", type: "image/jpeg" }] }
        : {}),
    });
  }, [title, artist, artwork]);

  // Update playback state
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Register action handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ["play", onPlay ?? null],
      ["pause", onPause ?? null],
      ["nexttrack", onNextTrack ?? null],
      ["previoustrack", onPreviousTrack ?? null],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some actions may not be supported on all platforms
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [onPlay, onPause, onNextTrack, onPreviousTrack]);
}
