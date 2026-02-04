import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Player } from "../components/Player";

const noop = () => {};

describe("Player", () => {
  it("shows nothing when no track", () => {
    const { container } = render(
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
