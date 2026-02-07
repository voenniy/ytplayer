import { describe, it, expect } from "vitest";
import { Player } from "../components/Player";
import { renderWithI18n } from "./test-utils";

const noop = () => {};

describe("Player", () => {
  it("shows nothing when no track", () => {
    const { container } = renderWithI18n(
      <Player
        currentTime={0}
        duration={0}
        volume={1}
        onPlayPause={noop}
        onNext={noop}
        onSeek={noop}
        onVolumeChange={noop}
      />,
    );
    expect(container.querySelector("[data-testid='player']")).toBeNull();
  });
});
