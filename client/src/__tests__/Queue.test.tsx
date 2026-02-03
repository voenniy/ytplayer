import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Queue } from "../components/Queue";

describe("Queue", () => {
  it("renders queue heading", () => {
    render(<Queue />);
    expect(screen.getByText(/очередь \(/i)).toBeInTheDocument();
  });
});
