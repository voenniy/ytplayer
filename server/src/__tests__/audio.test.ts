import { describe, it, expect } from "vitest";
import { buildStreamUrl, isValidVideoId } from "../services/audio";

describe("isValidVideoId", () => {
  it("accepts valid 11-char video ID", () => {
    expect(isValidVideoId("dQw4w9WgXcQ")).toBe(true);
    expect(isValidVideoId("abc_-123ABC")).toBe(true);
  });

  it("rejects invalid video IDs", () => {
    expect(isValidVideoId("")).toBe(false);
    expect(isValidVideoId("short")).toBe(false);
    expect(isValidVideoId("toolong12345")).toBe(false);
    expect(isValidVideoId("has spaces!")).toBe(false);
    expect(isValidVideoId("../etc/pass")).toBe(false);
  });
});

describe("buildStreamUrl", () => {
  it("throws on empty video ID", () => {
    expect(() => buildStreamUrl("")).toThrow("Invalid video ID");
  });

  it("throws on malformed video ID", () => {
    expect(() => buildStreamUrl("../../../etc")).toThrow("Invalid video ID");
    expect(() => buildStreamUrl("hello world")).toThrow("Invalid video ID");
  });

  it("returns a string URL for valid video ID", () => {
    const url = buildStreamUrl("dQw4w9WgXcQ");
    expect(typeof url).toBe("string");
    expect(url).toContain("dQw4w9WgXcQ");
  });
});
