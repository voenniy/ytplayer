import { describe, it, expect, vi } from "vitest";
import { searchYouTube, parseYouTubeUrl } from "../services/youtube";

describe("parseYouTubeUrl", () => {
  it("extracts video ID from standard URL", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("extracts video ID from short URL", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URL", () => {
    expect(parseYouTubeUrl("https://example.com")).toBeNull();
  });

  it("returns null for plain search query", () => {
    expect(parseYouTubeUrl("lofi hip hop")).toBeNull();
  });
});
