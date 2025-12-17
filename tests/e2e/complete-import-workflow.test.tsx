import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoEditor } from "@presentation/components/PhotoEditor/PhotoEditor";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { JSONPhotoRepository } from "@infrastructure/adapters/JSONPhotoRepository";
import { PhotoDescription } from "@application/ports/IPhotoRepository";
import { act } from "react";

describe("Complete Import Workflow E2E", () => {
  const validPhotoDescription: PhotoDescription = {
    canvas: {
      width: 15,
      height: 10,
      photo: {
        id: "imported-photo-id",
        src: "data:image/png;base64,importedImageData",
        width: 20,
        height: 15,
        x: -2.5,
        y: -2.5,
      },
    },
  };

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

    vi.clearAllMocks();
  });

  it("should complete full import workflow: import JSON -> verify photo -> verify coverage", async () => {
    const user = userEvent.setup();

    // Mock repository load
    vi.spyOn(JSONPhotoRepository.prototype, "load").mockResolvedValue(validPhotoDescription);

    render(<PhotoEditor />);

    // Step 1: Import valid JSON file
    const jsonFile = new File(
      [JSON.stringify(validPhotoDescription)],
      "photo.json",
      { type: "application/json" }
    );

    const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

    await user.upload(importInput, jsonFile);

    // Step 2: Verify photo restoration
    await waitFor(() => {
      const state = usePhotoEditorStore.getState();
      expect(state.photo).not.toBeNull();
    });

    const importedPhoto = usePhotoEditorStore.getState().photo!;

    // Step 3: Verify position and scale preservation
    expect(importedPhoto.id).toBe("imported-photo-id");
    expect(importedPhoto.src).toBe("data:image/png;base64,importedImageData");
    expect(importedPhoto.dimensions.width).toBe(20);
    expect(importedPhoto.dimensions.height).toBe(15);
    expect(importedPhoto.position.x).toBe(-2.5);
    expect(importedPhoto.position.y).toBe(-2.5);

    // Step 4: Verify canvas coverage
    expect(usePhotoEditorStore.getState().isCovered).toBe(true);

    // UI should show coverage indicator
    expect(screen.getByText("✓ Photo covers canvas")).toBeInTheDocument();

    // Controls should be visible
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Scale")).toBeInTheDocument();
    expect(screen.getByText("Print & Export")).toBeInTheDocument();
  });

  it("should handle import of photo at different position", async () => {
    const user = userEvent.setup();

    const customDescription: PhotoDescription = {
      canvas: {
        width: 15,
        height: 10,
        photo: {
          id: "custom-id",
          src: "data:image/png;base64,customData",
          width: 25,
          height: 18.75,
          x: -5,
          y: -4.375,
        },
      },
    };

    vi.spyOn(JSONPhotoRepository.prototype, "load").mockResolvedValue(customDescription);

    render(<PhotoEditor />);

    const jsonFile = new File([JSON.stringify(customDescription)], "photo.json", {
      type: "application/json",
    });

    const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

    await user.upload(importInput, jsonFile);

    await waitFor(() => {
      const photo = usePhotoEditorStore.getState().photo;
      expect(photo).not.toBeNull();
      expect(photo!.position.x).toBe(-5);
      expect(photo!.position.y).toBe(-4.375);
    });
  });

  it("should allow manipulation after import", async () => {
    const user = userEvent.setup();

    vi.spyOn(JSONPhotoRepository.prototype, "load").mockResolvedValue(validPhotoDescription);

    render(<PhotoEditor />);

    // Import photo
    const jsonFile = new File([JSON.stringify(validPhotoDescription)], "photo.json", {
      type: "application/json",
    });

    const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

    await user.upload(importInput, jsonFile);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().photo).not.toBeNull();
    });

    const initialDimensions = usePhotoEditorStore.getState().photo!.dimensions;

    // Manipulate: Scale photo
    const zoomInButton = screen.getByText(/zoom in/i);
    await user.click(zoomInButton);

    const newDimensions = usePhotoEditorStore.getState().photo!.dimensions;
    expect(newDimensions.width).toBeGreaterThan(initialDimensions.width);

    // Manipulate: Move photo
    const moveButton = screen.getByTitle("Move down");
    await user.click(moveButton);

    // Photo should be manipulated
    expect(usePhotoEditorStore.getState().photo).not.toBeNull();
  });

  it("should display imported photo dimensions", async () => {
    const user = userEvent.setup();

    vi.spyOn(JSONPhotoRepository.prototype, "load").mockResolvedValue(validPhotoDescription);

    render(<PhotoEditor />);

    const jsonFile = new File([JSON.stringify(validPhotoDescription)], "photo.json", {
      type: "application/json",
    });

    const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

    await user.upload(importInput, jsonFile);

    await waitFor(() => {
      // Should display current size
      expect(screen.getByText(/current size/i)).toBeInTheDocument();
      expect(screen.getByText(/20\.00" × 15\.00"/i)).toBeInTheDocument();
    });
  });

  it("should handle import of non-covering photo", async () => {
    const user = userEvent.setup();

    const nonCoveringDescription: PhotoDescription = {
      canvas: {
        width: 15,
        height: 10,
        photo: {
          id: "small-photo",
          src: "data:image/png;base64,smallData",
          width: 10,
          height: 8,
          x: 0,
          y: 0,
        },
      },
    };

    vi.spyOn(JSONPhotoRepository.prototype, "load").mockResolvedValue(nonCoveringDescription);

    render(<PhotoEditor />);

    const jsonFile = new File([JSON.stringify(nonCoveringDescription)], "photo.json", {
      type: "application/json",
    });

    const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

    await user.upload(importInput, jsonFile);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().photo).not.toBeNull();
    });

    // Should not cover canvas
    expect(usePhotoEditorStore.getState().isCovered).toBe(false);

    // Should show warning
    expect(screen.getByText("✗ Photo must cover entire canvas")).toBeInTheDocument();

    // Export button should be disabled
    const exportButton = screen.getByText(/export json/i);
    expect(exportButton).toBeDisabled();
  });

  it("should clear previous photo when importing new one", async () => {
    const user = userEvent.setup();

    vi.spyOn(JSONPhotoRepository.prototype, "load")
      .mockResolvedValueOnce(validPhotoDescription)
      .mockResolvedValueOnce({
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "second-photo",
            src: "data:image/png;base64,secondData",
            width: 30,
            height: 20,
            x: -7.5,
            y: -5,
          },
        },
      });

    render(<PhotoEditor />);

    const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

    // First import
    const jsonFile1 = new File([JSON.stringify(validPhotoDescription)], "photo1.json", {
      type: "application/json",
    });

    await user.upload(importInput, jsonFile1);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().photo?.id).toBe("imported-photo-id");
    });

    // Second import
    const jsonFile2 = new File(['{"canvas":{}}'], "photo2.json", {
      type: "application/json",
    });

    await user.upload(importInput, jsonFile2);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().photo?.id).toBe("second-photo");
    });
  });

  it("should allow re-export of imported photo", async () => {
    const user = userEvent.setup();

    vi.spyOn(JSONPhotoRepository.prototype, "load").mockResolvedValue(validPhotoDescription);
    vi.spyOn(JSONPhotoRepository.prototype, "save").mockResolvedValue(undefined);

    render(<PhotoEditor />);

    // Import
    const jsonFile = new File([JSON.stringify(validPhotoDescription)], "photo.json", {
      type: "application/json",
    });

    const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

    await user.upload(importInput, jsonFile);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().photo).not.toBeNull();
      expect(usePhotoEditorStore.getState().isCovered).toBe(true);
    });

    // Export
    const exportButton = screen.getByText(/export json/i);
    expect(exportButton).not.toBeDisabled();

    await user.click(exportButton);

    await waitFor(() => {
      expect(JSONPhotoRepository.prototype.save).toHaveBeenCalled();
    });
  });
});
