import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Player } from "../components/Player";

describe("Player", () => {
  it("shows nothing when no track", () => {
    const { container } = render(<Player />);
    expect(container.querySelector("[data-testid='player']")).toBeNull();
  });
});
