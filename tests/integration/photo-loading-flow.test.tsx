import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUploader } from "@presentation/components/Controls/FileUploader";
import { PhotoCanvas } from "@presentation/components/Canvas/PhotoCanvas";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { BrowserImageLoader } from "@infrastructure/adapters/BrowserImageLoader";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { act } from "react";
import { DATA_TEST_ID } from "@presentation/constants/dataTestId";

describe("Photo Loading Flow Integration", () => {
  beforeEach(() => {
    // Reset store
    act(() => {
      usePhotoEditorStore.setState({
        photo: null,
        isLoading: false,
        error: null,
        isCovered: false,
      });
    });

    // Mock BrowserImageLoader
    vi.spyOn(BrowserImageLoader.prototype, "load").mockResolvedValue({
      base64: "data:image/png;base64,mockdata",
      dimensions: new Dimensions(10, 6.67),
      pixelWidth: 3000,
      pixelHeight: 2000,
    });

    vi.clearAllMocks();
  });

  it("should complete full photo loading flow", async () => {
    const user = userEvent.setup();

    // Render both components together
    render(
      <>
        <FileUploader />
        <PhotoCanvas />
      </>
    );

    // Initial state - no photo
    expect(usePhotoEditorStore.getState().photo).toBeNull();

    // Select a file
    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    // Upload file
    await user.upload(input, file);

    // Wait for loading to complete
    await waitFor(() => {
      expect(usePhotoEditorStore.getState().isLoading).toBe(false);
    });

    // Photo should be loaded in store
    const state = usePhotoEditorStore.getState();
    expect(state.photo).not.toBeNull();
    expect(state.photo?.src).toBe("data:image/png;base64,mockdata");

    // Photo should cover canvas
    expect(state.isCovered).toBe(true);

    // Error should be null
    expect(state.error).toBeNull();
  });

  it("should show loading state during photo load", async () => {
    const user = userEvent.setup();

    // Mock slow loading
    vi.spyOn(BrowserImageLoader.prototype, "load").mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                base64: "data:image/png;base64,mockdata",
                dimensions: new Dimensions(10, 6.67),
                pixelWidth: 3000,
                pixelHeight: 2000,
              }),
            100
          )
        )
    );

    render(<FileUploader />);

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    // Start upload
    await user.upload(input, file);

    // Should show loading state
    expect(usePhotoEditorStore.getState().isLoading).toBe(true);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(usePhotoEditorStore.getState().isLoading).toBe(false);
    });
  });

  it("should handle photo loading error and update store", async () => {
    const user = userEvent.setup();

    // Mock loading error
    vi.spyOn(BrowserImageLoader.prototype, "load").mockRejectedValue(
      new Error("Failed to load image")
    );

    render(<FileUploader />);

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().error).toBe("Failed to load image");
    });

    expect(usePhotoEditorStore.getState().photo).toBeNull();
    expect(usePhotoEditorStore.getState().isLoading).toBe(false);
  });

  it("should clear previous error when loading new photo", async () => {
    const user = userEvent.setup();

    // Set initial error
    act(() => {
      usePhotoEditorStore.getState().setError("Previous error");
    });

    expect(usePhotoEditorStore.getState().error).toBe("Previous error");

    render(<FileUploader />);

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().error).toBeNull();
    });
  });

  it("should calculate correct initial photo position to center on canvas", async () => {
    const user = userEvent.setup();

    render(<FileUploader />);

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      const state = usePhotoEditorStore.getState();
      expect(state.photo).not.toBeNull();

      // Photo should be centered (negative position for larger photo)
      expect(state.photo!.position.x).toBeGreaterThanOrEqual(0);
      expect(state.photo!.position.y).toBeCloseTo(0);
    });
  });

  it("should scale photo to cover canvas on initial load", async () => {
    const user = userEvent.setup();

    // Mock a small image that needs scaling
    vi.spyOn(BrowserImageLoader.prototype, "load").mockResolvedValue({
      base64: "data:image/png;base64,mockdata",
      dimensions: new Dimensions(5, 3.33), // Small image
      pixelWidth: 1500,
      pixelHeight: 1000,
    });

    render(<FileUploader />);

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      const state = usePhotoEditorStore.getState();
      expect(state.photo).not.toBeNull();

      // Photo should be scaled up to cover canvas (15" x 10")
      expect(state.photo!.dimensions.width).toBeGreaterThanOrEqual(15);
      expect(state.photo!.dimensions.height).toBeGreaterThanOrEqual(10);
      expect(state.isCovered).toBe(true);
    });
  });

  it("should preserve original dimensions for aspect ratio", async () => {
    const user = userEvent.setup();

    render(<FileUploader />);

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      const state = usePhotoEditorStore.getState();
      expect(state.photo).not.toBeNull();

      // Original dimensions should be preserved
      expect(state.photo!.originalDimensions.width).toBe(10);
      expect(state.photo!.originalDimensions.height).toBeCloseTo(6.67, 1);

      // Current dimensions should be scaled
      expect(state.photo!.dimensions.width).toBeGreaterThan(10);
    });
  });
});
