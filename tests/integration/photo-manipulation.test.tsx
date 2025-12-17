import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PositionControls } from "@presentation/components/Controls/PositionControls";
import { ScaleControls } from "@presentation/components/Controls/ScaleControls";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Photo } from "@domain/entities/Photo";
import { Canvas } from "@domain/entities/Canvas";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";
import { act } from "react";

describe("Photo Manipulation Integration", () => {
  const createInitialPhoto = (): Photo => {
    return new Photo(
      "test-id",
      "data:image/png;base64,test",
      new Dimensions(20, 15),
      new Position(-2.5, -2.5),
      new Dimensions(20, 15),
    );
  };

  beforeEach(() => {
    // Reset store with a loaded photo
    const photo = createInitialPhoto();

    act(() => {
      usePhotoEditorStore.setState({
        photo,
        canvas: Canvas.PRINT_CANVAS,
        isLoading: false,
        error: null,
        isCovered: true,
      });
    });
  });

  it("should move photo and update coverage status", async () => {
    const user = userEvent.setup();

    render(<PositionControls />);

    const initialState = usePhotoEditorStore.getState();
    expect(initialState.isCovered).toBe(true);

    // Move photo to a non-covering position
    const rightButton = screen.getByTitle("Move left");

    await act(async () => {
      // Move multiple times to break coverage
      for (let i = 0; i < 30; i++) {
        await user.click(rightButton);
      }
    });

    const finalState = usePhotoEditorStore.getState();

    // Position should have changed
    expect(finalState.photo!.position.x).toBeGreaterThan(
      initialState.photo!.position.x,
    );

    // Coverage should be broken
    expect(finalState.isCovered).toBe(false);
  });

  it("should scale photo and update coverage status", async () => {
    const user = userEvent.setup();

    render(<ScaleControls />);

    const initialState = usePhotoEditorStore.getState();
    expect(initialState.isCovered).toBe(true);

    // Scale down to break coverage
    const zoomOutButton = screen.getByText(/zoom out/i);

    await act(async () => {
      // Scale down multiple times
      for (let i = 0; i < 10; i++) {
        await user.click(zoomOutButton);
      }
    });

    const finalState = usePhotoEditorStore.getState();

    // Dimensions should be smaller
    expect(finalState.photo!.dimensions.width).toBeLessThan(
      initialState.photo!.dimensions.width,
    );
    expect(finalState.photo!.dimensions.height).toBeLessThan(
      initialState.photo!.dimensions.height,
    );

    // Coverage should be broken
    expect(finalState.isCovered).toBe(false);
  });

  it("should combine position and scale operations", async () => {
    const user = userEvent.setup();

    render(
      <>
        <PositionControls />
        <ScaleControls />
      </>,
    );

    const initialPhoto = usePhotoEditorStore.getState().photo!;

    // First, scale up
    await act(async () => {
      await user.click(screen.getByText(/zoom in/i));
      await user.click(screen.getByText(/zoom in/i));
    });

    const afterScalePhoto = usePhotoEditorStore.getState().photo!;
    expect(afterScalePhoto.dimensions.width).toBeGreaterThan(
      initialPhoto.dimensions.width,
    );

    // Then, move
    await act(async () => {
      await user.click(screen.getByTitle("Move down"));
      await user.click(screen.getByTitle("Move right"));
    });

    const finalPhoto = usePhotoEditorStore.getState().photo!;

    // Both operations should have affected the photo
    expect(finalPhoto.dimensions.width).toBeGreaterThan(
      initialPhoto.dimensions.width,
    );
    expect(finalPhoto.position.y).toBeLessThan(initialPhoto.position.y);
    expect(finalPhoto.position.x).toBeLessThan(initialPhoto.position.x);
  });

  it("should maintain immutability during manipulations", async () => {
    const user = userEvent.setup();

    render(<PositionControls />);

    const originalPhoto = usePhotoEditorStore.getState().photo!;
    const originalPosition = { ...originalPhoto.position };

    await act(async () => {
      await user.click(screen.getByTitle("Move down"));
    });

    // Original photo object should not be mutated
    expect(originalPhoto.position.x).toBe(originalPosition.x);
    expect(originalPhoto.position.y).toBe(originalPosition.y);

    // But store should have new photo
    const newPhoto = usePhotoEditorStore.getState().photo!;
    expect(newPhoto).not.toBe(originalPhoto);
    expect(newPhoto.position.y).not.toBe(originalPosition.y);
  });

  it("should restore coverage after fixing photo position", async () => {
    const user = userEvent.setup();

    render(<PositionControls />);

    // Break coverage
    await act(async () => {
      for (let i = 0; i < 30; i++) {
        await user.click(screen.getByTitle("Move left"));
      }
    });

    expect(usePhotoEditorStore.getState().isCovered).toBe(false);

    // Fix coverage
    await act(async () => {
      for (let i = 0; i < 30; i++) {
        await user.click(screen.getByTitle("Move right"));
      }
    });

    expect(usePhotoEditorStore.getState().isCovered).toBe(true);
  });

  it("should restore coverage after scaling back up", async () => {
    const user = userEvent.setup();

    render(<ScaleControls />);

    // Break coverage by scaling down
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByText(/zoom out/i));
      }
    });

    expect(usePhotoEditorStore.getState().isCovered).toBe(false);

    // Restore coverage by scaling up
    await act(async () => {
      for (let i = 0; i < 15; i++) {
        await user.click(screen.getByText(/zoom in/i));
      }
    });

    expect(usePhotoEditorStore.getState().isCovered).toBe(true);
  });

  it("should handle rapid successive operations", async () => {
    const user = userEvent.setup();

    render(
      <>
        <PositionControls />
        <ScaleControls />
      </>,
    );

    // Rapid operations
    await act(async () => {
      await user.click(screen.getByText(/zoom in/i));
      await user.click(screen.getByTitle("Move down"));
      await user.click(screen.getByText(/zoom out/i));
      await user.click(screen.getByTitle("Move left"));
      await user.click(screen.getByText(/zoom in/i));
    });

    const finalState = usePhotoEditorStore.getState();

    // Should still have a valid photo
    expect(finalState.photo).not.toBeNull();
    expect(finalState.error).toBeNull();
  });

  it("should validate canvas coverage after each operation", async () => {
    const user = userEvent.setup();

    render(
      <>
        <PositionControls />
        <ScaleControls />
      </>,
    );

    const canvas = Canvas.PRINT_CANVAS;

    // Perform operations
    await act(async () => {
      await user.click(screen.getByText(/zoom in/i));
    });

    let state = usePhotoEditorStore.getState();
    let photo = state.photo!;

    // Manual validation should match store state
    expect(canvas.isFullyCovered(photo)).toBe(state.isCovered);

    await act(async () => {
      await user.click(screen.getByTitle("Move down"));
    });

    state = usePhotoEditorStore.getState();
    photo = state.photo!;

    expect(canvas.isFullyCovered(photo)).toBe(state.isCovered);
  });

  it("should display updated dimensions after scaling", async () => {
    const user = userEvent.setup();

    render(<ScaleControls />);

    const initialDimensions = usePhotoEditorStore.getState().photo!.dimensions;

    // Display should show current dimensions
    expect(screen.getByText(/current size/i)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${initialDimensions.width.toFixed(2)}`)),
    ).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText(/zoom in/i));
    });

    const newDimensions = usePhotoEditorStore.getState().photo!.dimensions;

    // Display should update
    expect(
      screen.getByText(new RegExp(`${newDimensions.width.toFixed(2)}`)),
    ).toBeInTheDocument();
  });

  it("should handle scaling errors gracefully", async () => {
    render(<ScaleControls />);

    // Manually trigger an error in the store
    act(() => {
      usePhotoEditorStore.getState().scalePhoto(0); // Invalid scale factor
    });

    const state = usePhotoEditorStore.getState();

    // Error should be set
    expect(state.error).toBe("Scale factor must be positive");

    // Photo should remain unchanged
    expect(state.photo).not.toBeNull();
  });
});
