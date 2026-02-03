import { spawn } from "child_process";
import type { Readable } from "stream";

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function isValidVideoId(videoId: string): boolean {
  return VIDEO_ID_REGEX.test(videoId);
}

export function buildStreamUrl(videoId: string): string {
  if (!videoId || !isValidVideoId(videoId)) {
    throw new Error("Invalid video ID");
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getAudioStream(videoId: string): Readable {
  const url = buildStreamUrl(videoId);

  const ytdlp = spawn("yt-dlp", [
    "-f", "bestaudio",
    "-o", "-",
    "--no-playlist",
    "--no-warnings",
    url,
  ]);

  ytdlp.stderr.on("data", (data) => {
    console.error(`yt-dlp stderr: ${data}`);
  });

  return ytdlp.stdout;
}
