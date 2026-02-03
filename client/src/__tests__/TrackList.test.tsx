import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TrackList } from "../components/TrackList";

const mockTracks = [
  { id: "abc", title: "Test Song", artist: "Artist", thumbnail: "http://img.jpg", duration: 240, viewCount: 1000, likeCount: 50 },
  { id: "def", title: "Another Song", artist: "Band", thumbnail: "http://img2.jpg", duration: 180, viewCount: 500, likeCount: 20 },
];

describe("TrackList", () => {
  it("renders track titles", () => {
    render(<TrackList tracks={mockTracks} onPlay={vi.fn()} onAddToQueue={vi.fn()} />);
    expect(screen.getByText("Test Song")).toBeInTheDocument();
    expect(screen.getByText("Another Song")).toBeInTheDocument();
  });

  it("calls onPlay when track is clicked", async () => {
    const onPlay = vi.fn();
    render(<TrackList tracks={mockTracks} onPlay={onPlay} onAddToQueue={vi.fn()} />);
    await userEvent.click(screen.getByText("Test Song"));
    expect(onPlay).toHaveBeenCalledWith(mockTracks[0]);
  });
});
