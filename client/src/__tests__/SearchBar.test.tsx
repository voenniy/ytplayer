import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SearchBar } from "../components/SearchBar";
import { renderWithI18n } from "./test-utils";

describe("SearchBar", () => {
  it("renders input field", () => {
    renderWithI18n(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText(/ссылка|поиск/i)).toBeInTheDocument();
  });

  it("calls onSearch when submitting", async () => {
    const onSearch = vi.fn();
    renderWithI18n(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/ссылка|поиск/i);
    await userEvent.type(input, "lofi beats{Enter}");

    expect(onSearch).toHaveBeenCalledWith("lofi beats");
  });
});
