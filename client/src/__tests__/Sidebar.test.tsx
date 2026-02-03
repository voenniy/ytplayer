import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sidebar } from "../components/Sidebar";

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify([]), { status: 200 }),
  );
});

describe("Sidebar", () => {
  it("renders playlists heading", () => {
    render(<Sidebar />);
    expect(screen.getByText(/плейлист/i)).toBeInTheDocument();
  });
});
