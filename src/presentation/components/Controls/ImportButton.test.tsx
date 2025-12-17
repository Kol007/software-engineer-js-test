import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportButton } from "./ImportButton";
import { usePhotoImport } from "@presentation/hooks/usePhotoImport";

vi.mock("@presentation/hooks/usePhotoImport");

describe("ImportButton", () => {
  const mockImportPhoto = vi.fn();

  beforeEach(() => {
    vi.mocked(usePhotoImport).mockReturnValue({
      importPhoto: mockImportPhoto,
      isImporting: false,
    });

    vi.clearAllMocks();
  });

  it("should render import button", () => {
    render(<ImportButton />);

    expect(screen.getByText(/import json/i)).toBeInTheDocument();
  });

  it("should render hidden file input", () => {
    render(<ImportButton />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveStyle({ display: "none" });
  });

  it("should have file input with correct accept type", () => {
    render(<ImportButton />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", "application/json");
  });

  it("should call importPhoto when file is selected", async () => {
    const user = userEvent.setup();
    const file = new File(['{"canvas":{}}'], "photo.json", {
      type: "application/json",
    });

    render(<ImportButton />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(mockImportPhoto).toHaveBeenCalledWith(file);
    });
  });

  it("should reset input value after file selection", async () => {
    const user = userEvent.setup();
    const file = new File(['{"canvas":{}}'], "photo.json", {
      type: "application/json",
    });

    render(<ImportButton />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("should show importing text when isImporting is true", () => {
    vi.mocked(usePhotoImport).mockReturnValue({
      importPhoto: mockImportPhoto,
      isImporting: true,
    });

    render(<ImportButton />);

    expect(screen.getByText("Importing...")).toBeInTheDocument();
  });

  it("should show import JSON text when not importing", () => {
    render(<ImportButton />);

    expect(screen.getByText(/📂 import json/i)).toBeInTheDocument();
  });

  it("should disable input when isImporting is true", () => {
    vi.mocked(usePhotoImport).mockReturnValue({
      importPhoto: mockImportPhoto,
      isImporting: true,
    });

    render(<ImportButton />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });

  it("should not call importPhoto if no file is selected", async () => {
    const user = userEvent.setup();

    render(<ImportButton />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Trigger change event without file
    await user.click(input);

    expect(mockImportPhoto).not.toHaveBeenCalled();
  });

  it("should have accessible label association", () => {
    render(<ImportButton />);

    const input = document.querySelector('input[type="file"]');
    const label = document.querySelector('label[for="json-input"]');

    expect(input).toHaveAttribute("id", "json-input");
    expect(label).toBeInTheDocument();
  });

  it("should handle clicking on button to trigger file input", async () => {
    const user = userEvent.setup();

    render(<ImportButton />);

    const button = screen.getByText(/import json/i);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Mock the click on input
    vi.spyOn(input, "click");

    // Clicking button should trigger label, which triggers input
    await user.click(button);

    // Note: In JSDOM, clicking the label doesn't automatically trigger the input click,
    // but in real browsers it does. This test verifies the structure is correct.
    expect(button.closest("label")).toHaveAttribute("for", "json-input");
  });

  it("should update text when import state changes", () => {
    const { rerender } = render(<ImportButton />);

    expect(screen.getByText(/import json/i)).toBeInTheDocument();

    vi.mocked(usePhotoImport).mockReturnValue({
      importPhoto: mockImportPhoto,
      isImporting: true,
    });

    rerender(<ImportButton />);

    expect(screen.getByText("Importing...")).toBeInTheDocument();
  });
});
