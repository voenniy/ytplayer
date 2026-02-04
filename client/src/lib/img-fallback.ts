import type { SyntheticEvent } from "react";

// SVG music note icon as data URI fallback for broken thumbnails
const FALLBACK_SRC =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="24" height="24" fill="#27272a" rx="4"/><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  );

export function handleImgError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== FALLBACK_SRC) {
    img.src = FALLBACK_SRC;
  }
}
