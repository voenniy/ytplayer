import { useEffect, useRef, useState, useCallback } from "react";
import { getStreamUrl } from "@/lib/api";

interface UseAudioReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (videoId: string) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
}

// Single Audio element created once, outside React lifecycle
let globalAudio: HTMLAudioElement | null = null;
function getAudio(): HTMLAudioElement {
  if (!globalAudio) globalAudio = new Audio();
  return globalAudio;
}

export function useAudio(onEnded?: () => void): UseAudioReturn {
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);

  useEffect(() => {
    const audio = getAudio();

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEndedHandler = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };
    const onError = () => {
      console.error("Audio error:", audio.error?.message);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEndedHandler);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEndedHandler);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const play = useCallback((videoId: string) => {
    const audio = getAudio();
    audio.src = getStreamUrl(videoId);
    audio.play().catch((err) => {
      // Ignore AbortError from rapid play/pause
      if (err.name !== "AbortError") console.error("Play failed:", err);
    });
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    getAudio().pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    getAudio().play().catch((err) => {
      if (err.name !== "AbortError") console.error("Resume failed:", err);
    });
    setIsPlaying(true);
  }, []);

  const seek = useCallback((time: number) => {
    getAudio().currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    getAudio().volume = vol;
    setVolumeState(vol);
  }, []);

  return { isPlaying, currentTime, duration, volume, play, pause, resume, seek, setVolume };
}
