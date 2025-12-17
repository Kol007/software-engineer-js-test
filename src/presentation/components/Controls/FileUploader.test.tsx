import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUploader } from "./FileUploader";
import { useImageLoader } from "@presentation/hooks/useImageLoader";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { DATA_TEST_ID } from "@presentation/constants/dataTestId.ts";

vi.mock("@presentation/hooks/useImageLoader");
vi.mock("@presentation/store/photoEditorStore");

describe("FileUploader", () => {
  const mockLoadImage = vi.fn();

  beforeEach(() => {
    vi.mocked(useImageLoader).mockReturnValue({
      loadImage: mockLoadImage,
    });

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      isLoading: false,
    } as any);

    vi.clearAllMocks();
  });

  it("should render file input with correct accept types", () => {
    render(<FileUploader />);

    const input = screen.getByTestId(
      DATA_TEST_ID.imageInput,
    ) as HTMLInputElement;

    expect(input).toHaveAttribute(
      "accept",
      "image/jpeg,image/jpg,image/png,image/gif,image/webp",
    );
    expect(input).toHaveAttribute("type", "file");
  });

  it("should render select photo button", () => {
    render(<FileUploader />);

    expect(screen.getByText(/select photo/i)).toBeInTheDocument();
  });

  it("should call loadImage when file is selected", async () => {
    const user = userEvent.setup();
    const file = new File(["test"], "test.png", { type: "image/png" });

    render(<FileUploader />);

    const input = screen.getByTestId(
      DATA_TEST_ID.imageInput,
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledWith(file);
    });
  });

  it("should reset input value after file selection", async () => {
    const user = userEvent.setup();
    const file = new File(["test"], "test.png", { type: "image/png" });

    render(<FileUploader />);

    const input = screen.getByTestId(
      DATA_TEST_ID.imageInput,
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("should show loading text when isLoading is true", () => {
    vi.mocked(usePhotoEditorStore).mockReturnValue({
      isLoading: true,
    } as any);

    render(<FileUploader />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should disable input when isLoading is true", () => {
    vi.mocked(usePhotoEditorStore).mockReturnValue({
      isLoading: true,
    } as any);

    render(<FileUploader />);

    const input = screen.getByTestId(
      DATA_TEST_ID.imageInput,
    ) as HTMLInputElement;

    expect(input).toBeDisabled();
  });

  it("should handle multiple file selections", async () => {
    const user = userEvent.setup();
    const file1 = new File(["test1"], "test1.png", { type: "image/png" });
    const file2 = new File(["test2"], "test2.png", { type: "image/png" });

    render(<FileUploader />);

    const input = screen.getByTestId(
      DATA_TEST_ID.imageInput,
    ) as HTMLInputElement;

    await user.upload(input, file1);

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledWith(file1);
    });

    mockLoadImage.mockClear();

    await user.upload(input, file2);

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledWith(file2);
    });
  });

  it("should not call loadImage if no file is selected", async () => {
    const user = userEvent.setup();

    render(<FileUploader />);

    const input = screen.getByTestId(
      DATA_TEST_ID.imageInput,
    ) as HTMLInputElement;

    // Trigger change event without file
    await user.click(input);

    expect(mockLoadImage).not.toHaveBeenCalled();
  });

  it("should have accessible label", () => {
    render(<FileUploader />);

    const input = screen.getByTestId(
      DATA_TEST_ID.imageInput,
    ) as HTMLInputElement;

    expect(input).toHaveAttribute("id", "image-input");
  });

  it("should allow same file to be selected again after reset", async () => {
    const user = userEvent.setup();
    const file = new File(["test"], "test.png", { type: "image/png" });

    render(<FileUploader />);

    const input = screen.getByTestId(
      DATA_TEST_ID.imageInput,
    ) as HTMLInputElement;

    // First selection
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledWith(file);
    });

    mockLoadImage.mockClear();

    // Second selection of same file (should work because input was reset)
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledWith(file);
    });
  });
});
