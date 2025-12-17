import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoEditor } from "@presentation/components/PhotoEditor/PhotoEditor";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { BrowserImageLoader } from "@infrastructure/adapters/BrowserImageLoader";
import { JSONPhotoRepository } from "@infrastructure/adapters/JSONPhotoRepository";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { act } from "react";
import { DATA_TEST_ID } from "@presentation/constants/dataTestId";

describe("Complete Export Workflow E2E", () => {
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
      base64: "data:image/png;base64,testImageData",
      dimensions: new Dimensions(10, 6.67),
      pixelWidth: 3000,
      pixelHeight: 2000,
    });

    // Mock JSONPhotoRepository save
    vi.spyOn(JSONPhotoRepository.prototype, "save").mockResolvedValue(undefined);

    vi.clearAllMocks();
  });

  it("should complete full export workflow: upload -> position -> scale -> export", async () => {
    const user = userEvent.setup();

    render(<PhotoEditor />);

    // Step 1: Upload image file
    const file = new File(["test"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().photo).not.toBeNull();
    });

    // Photo should be loaded and cover canvas initially
    expect(usePhotoEditorStore.getState().isCovered).toBe(true);

    // Step 2: Position photo (move it around)
    const moveUpButton = screen.getByTitle("Move down");
    await user.click(moveUpButton);
    await user.click(moveUpButton);

    // Photo position should have changed
    const photoAfterMove = usePhotoEditorStore.getState().photo!;
    expect(photoAfterMove).not.toBeNull();

    // Step 3: Scale photo to ensure it covers canvas
    const zoomInButton = screen.getByText(/zoom in/i);
    await user.click(zoomInButton);

    // Should still cover canvas
    await waitFor(() => {
      expect(usePhotoEditorStore.getState().isCovered).toBe(true);
    });

    // Step 4: Export JSON file
    const exportButton = screen.getByText(/export json/i);
    expect(exportButton).not.toBeDisabled();

    await user.click(exportButton);

    // Step 5: Verify JSON structure and content
    await waitFor(() => {
      expect(JSONPhotoRepository.prototype.save).toHaveBeenCalled();
    });

    const saveCall = vi.mocked(JSONPhotoRepository.prototype.save).mock.calls[0];
    const savedDescription = saveCall[0];

    // Verify JSON structure
    expect(savedDescription).toHaveProperty("canvas");
    expect(savedDescription.canvas).toHaveProperty("width", 15);
    expect(savedDescription.canvas).toHaveProperty("height", 10);
    expect(savedDescription.canvas).toHaveProperty("photo");

    // Verify photo properties
    const savedPhoto = savedDescription.canvas.photo;
    expect(savedPhoto).toHaveProperty("id");
    expect(savedPhoto).toHaveProperty("src", "data:image/png;base64,testImageData");
    expect(savedPhoto).toHaveProperty("width");
    expect(savedPhoto).toHaveProperty("height");
    expect(savedPhoto).toHaveProperty("x");
    expect(savedPhoto).toHaveProperty("y");

    // Verify photo dimensions are numbers
    expect(typeof savedPhoto.width).toBe("number");
    expect(typeof savedPhoto.height).toBe("number");
    expect(typeof savedPhoto.x).toBe("number");
    expect(typeof savedPhoto.y).toBe("number");
  });

  it("should prevent export if photo doesn't cover canvas", async () => {
    const user = userEvent.setup();

    render(<PhotoEditor />);

    // Upload image
    const file = new File(["test"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().photo).not.toBeNull();
    });

    // Scale down to break coverage
    const zoomOutButton = screen.getByText(/zoom out/i);
    for (let i = 0; i < 10; i++) {
      await user.click(zoomOutButton);
    }

    // Coverage should be broken
    await waitFor(() => {
      expect(usePhotoEditorStore.getState().isCovered).toBe(false);
    });

    // Export button should be disabled
    const exportButton = screen.getByText(/export json/i);
    expect(exportButton).toBeDisabled();

    // Clicking should not trigger export
    await user.click(exportButton);

    expect(JSONPhotoRepository.prototype.save).not.toHaveBeenCalled();
  });

  it("should export with exact photo position and dimensions", async () => {
    const user = userEvent.setup();

    render(<PhotoEditor />);

    // Upload image
    const file = new File(["test"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().photo).not.toBeNull();
    });

    // Get current photo state
    const currentPhoto = usePhotoEditorStore.getState().photo!;

    // Export
    const exportButton = screen.getByText(/export json/i);
    await user.click(exportButton);

    await waitFor(() => {
      expect(JSONPhotoRepository.prototype.save).toHaveBeenCalled();
    });

    const savedDescription = vi.mocked(JSONPhotoRepository.prototype.save).mock.calls[0][0];
    const savedPhoto = savedDescription.canvas.photo;

    // Exported data should match current photo state
    expect(savedPhoto.width).toBe(currentPhoto.dimensions.width);
    expect(savedPhoto.height).toBe(currentPhoto.dimensions.height);
    expect(savedPhoto.x).toBe(currentPhoto.position.x);
    expect(savedPhoto.y).toBe(currentPhoto.position.y);
    expect(savedPhoto.src).toBe(currentPhoto.src);
  });

  it("should show coverage indicator throughout workflow", async () => {
    const user = userEvent.setup();

    render(<PhotoEditor />);

    // Initially no photo
    expect(screen.queryByText(/covers canvas/i)).not.toBeInTheDocument();

    // Upload image
    const file = new File(["test"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText("✓ Photo covers canvas")).toBeInTheDocument();
    });

    // Break coverage
    const zoomOutButton = screen.getByText(/zoom out/i);
    for (let i = 0; i < 10; i++) {
      await user.click(zoomOutButton);
    }

    await waitFor(() => {
      expect(screen.getByText("✗ Photo must cover entire canvas")).toBeInTheDocument();
    });

    // Restore coverage
    const zoomInButton = screen.getByText(/zoom in/i);
    for (let i = 0; i < 15; i++) {
      await user.click(zoomInButton);
    }

    await waitFor(() => {
      expect(screen.getByText("✓ Photo covers canvas")).toBeInTheDocument();
    });
  });
});
