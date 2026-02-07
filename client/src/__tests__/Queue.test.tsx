import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Queue } from "../components/Queue";
import { renderWithI18n } from "./test-utils";

describe("Queue", () => {
  it("renders queue heading", () => {
    renderWithI18n(<Queue />);
    expect(screen.getByText(/очередь \(/i)).toBeInTheDocument();
  });
});
