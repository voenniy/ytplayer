import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SearchBar } from "../components/SearchBar";

describe("SearchBar", () => {
  it("renders input field", () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText(/ссылка|поиск/i)).toBeInTheDocument();
  });

  it("calls onSearch when submitting", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/ссылка|поиск/i);
    await userEvent.type(input, "lofi beats{Enter}");

    expect(onSearch).toHaveBeenCalledWith("lofi beats");
  });
});
