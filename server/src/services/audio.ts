import { spawn } from "child_process";
import type { Readable } from "stream";

export function buildStreamUrl(videoId: string): string {
  if (!videoId) throw new Error("Video ID is required");
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
