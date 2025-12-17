import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportButton } from "./ExportButton";
import { usePhotoExport } from "@presentation/hooks/usePhotoExport";

vi.mock("@presentation/hooks/usePhotoExport");

describe("ExportButton", () => {
  const mockExportPhoto = vi.fn();

  beforeEach(() => {
    vi.mocked(usePhotoExport).mockReturnValue({
      exportPhoto: mockExportPhoto,
      isExporting: false,
    });

    vi.clearAllMocks();
  });

  it("should render export button", () => {
    render(<ExportButton />);

    expect(
      screen.getByRole("button", { name: /export json/i }),
    ).toBeInTheDocument();
  });

  it("should call exportPhoto when clicked", async () => {
    const user = userEvent.setup();

    render(<ExportButton />);

    await user.click(screen.getByRole("button"));

    expect(mockExportPhoto).toHaveBeenCalledTimes(1);
  });

  it("should show exporting text when isExporting is true", () => {
    vi.mocked(usePhotoExport).mockReturnValue({
      exportPhoto: mockExportPhoto,
      isExporting: true,
    });

    render(<ExportButton />);

    expect(screen.getByText("Exporting...")).toBeInTheDocument();
  });

  it("should not call exportPhoto when disabled", async () => {
    const user = userEvent.setup();

    render(<ExportButton disabled />);

    await user.click(screen.getByRole("button"));

    expect(mockExportPhoto).not.toHaveBeenCalled();
  });

  it("should update text when export state changes", () => {
    const { rerender } = render(<ExportButton />);

    expect(screen.getByText(/export json/i)).toBeInTheDocument();

    vi.mocked(usePhotoExport).mockReturnValue({
      exportPhoto: mockExportPhoto,
      isExporting: true,
    });

    rerender(<ExportButton />);

    expect(screen.getByText("Exporting...")).toBeInTheDocument();
  });
});
