import { describe, it, expect } from "vitest";
import { buildStreamUrl } from "../services/audio";

describe("buildStreamUrl", () => {
  it("throws on empty video ID", () => {
    expect(() => buildStreamUrl("")).toThrow();
  });

  it("returns a string URL for valid video ID", () => {
    const url = buildStreamUrl("dQw4w9WgXcQ");
    expect(typeof url).toBe("string");
    expect(url).toContain("dQw4w9WgXcQ");
  });
});
