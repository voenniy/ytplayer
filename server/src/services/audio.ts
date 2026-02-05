import { spawn } from "child_process";
import { logger } from "../lib/logger";

const log = logger.child({ service: "yt-dlp" });

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

export interface AudioInfo {
  audioUrl: string;
  contentLength: number;
  contentType: string;
  httpHeaders: Record<string, string>;
}

interface CacheEntry extends AudioInfo {
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function isValidVideoId(videoId: string): boolean {
  return VIDEO_ID_REGEX.test(videoId);
}

export function buildStreamUrl(videoId: string): string {
  if (!videoId || !isValidVideoId(videoId)) {
    throw new Error("Invalid video ID");
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function clearCache(): void {
  cache.clear();
}

export function invalidateCache(videoId: string): void {
  cache.delete(videoId);
}

function pickBestAudioFormat(formats: any[]): { url: string; contentLength: number; mimeType: string; httpHeaders: Record<string, string> } | null {
  const audioOnly = formats.filter((f) => f.vcodec === "none" && f.acodec !== "none" && f.url);
  if (audioOnly.length === 0) return null;
  audioOnly.sort((a, b) => (b.abr || 0) - (a.abr || 0));
  const best = audioOnly[0];
  // mime_type from yt-dlp: "audio/webm; codecs=opus" — strip codecs for Content-Type
  const mimeType = best.mime_type
    ? best.mime_type.split(";")[0].trim()
    : "audio/webm";
  return {
    url: best.url,
    contentLength: best.content_length || best.filesize || best.filesize_approx || 0,
    mimeType,
    httpHeaders: best.http_headers || {},
  };
}

function fetchYtdlpJson(videoId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = buildStreamUrl(videoId);
    const proc = spawn("yt-dlp", [
      "--dump-json", "--no-warnings", "--no-playlist",
      "-f", "bestaudio",
      url,
    ]);

    let stdout = "";
    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on("data", (data: Buffer) => {
      log.warn({ stderr: data.toString().trim() }, "yt-dlp stderr");
    });
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`yt-dlp exited with code ${code}`));
      try { resolve(JSON.parse(stdout)); }
      catch { reject(new Error("Failed to parse yt-dlp JSON")); }
    });
    proc.on("error", reject);
  });
}

export async function resolveAudioUrl(videoId: string): Promise<AudioInfo> {
  if (!videoId || !isValidVideoId(videoId)) {
    throw new Error("Invalid video ID");
  }

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return { audioUrl: cached.audioUrl, contentLength: cached.contentLength, contentType: cached.contentType, httpHeaders: cached.httpHeaders };
  }

  cache.delete(videoId);

  const json = await fetchYtdlpJson(videoId);
  const best = pickBestAudioFormat(json.formats || []);
  if (!best) throw new Error("No audio format found");

  const entry: CacheEntry = {
    audioUrl: best.url,
    contentLength: best.contentLength,
    contentType: best.mimeType,
    httpHeaders: best.httpHeaders,
    expiresAt: Date.now() + CACHE_TTL,
  };

  cache.set(videoId, entry);

  return { audioUrl: entry.audioUrl, contentLength: entry.contentLength, contentType: entry.contentType, httpHeaders: entry.httpHeaders };
}
