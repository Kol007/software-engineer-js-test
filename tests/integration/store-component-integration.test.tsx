import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoEditor } from "@presentation/components/PhotoEditor/PhotoEditor";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";
import { act } from "react";

describe("Store-Component Integration", () => {
  const createTestPhoto = (): Photo => {
    return new Photo(
      "test-id",
      "data:image/png;base64,test",
      new Dimensions(20, 15),
      new Position(-2.5, -2.5),
      new Dimensions(20, 15),
    );
  };

  beforeEach(() => {
    act(() => {
      usePhotoEditorStore.setState({
        photo: null,
        isLoading: false,
        error: null,
        isCovered: false,
      });
    });
  });

  it("should show/hide controls based on photo state", () => {
    const { rerender } = render(<PhotoEditor />);

    // No photo - controls hidden
    expect(screen.queryByText("Position")).not.toBeInTheDocument();
    expect(screen.queryByText("Scale")).not.toBeInTheDocument();
    expect(screen.queryByText("Print & Export")).not.toBeInTheDocument();

    // Add photo
    act(() => {
      const photo = createTestPhoto();
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    rerender(<PhotoEditor />);

    // Controls should appear
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Scale")).toBeInTheDocument();
    expect(screen.getByText("Print & Export")).toBeInTheDocument();
  });

  it("should update coverage indicator when photo is manipulated", async () => {
    const photo = createTestPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { rerender } = render(<PhotoEditor />);

    // Initially covered
    expect(screen.getByText("✓ Photo covers canvas")).toBeInTheDocument();

    // Scale down to break coverage
    act(() => {
      usePhotoEditorStore.getState().scalePhoto(0.5);
    });

    rerender(<PhotoEditor />);

    // Coverage broken
    expect(
      screen.getByText("✗ Photo must cover entire canvas"),
    ).toBeInTheDocument();
  });

  it("should display error from store", () => {
    const { rerender } = render(<PhotoEditor />);

    // No error initially
    expect(screen.queryByText("Test error message")).not.toBeInTheDocument();

    // Set error
    act(() => {
      usePhotoEditorStore.getState().setError("Test error message");
    });

    rerender(<PhotoEditor />);

    // Error displayed
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should clear error when new photo is loaded", () => {
    act(() => {
      usePhotoEditorStore.getState().setError("Previous error");
    });

    const { rerender } = render(<PhotoEditor />);

    expect(screen.getByText("Previous error")).toBeInTheDocument();

    // Load photo
    act(() => {
      const photo = createTestPhoto();
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    rerender(<PhotoEditor />);

    // Error cleared
    expect(screen.queryByText("Previous error")).not.toBeInTheDocument();
  });

  it("should reflect store state in all components simultaneously", () => {
    const photo = createTestPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    render(<PhotoEditor />);

    // Multiple components should reflect the same photo state
    expect(screen.getByText("✓ Photo covers canvas")).toBeInTheDocument();

    // Photo dimensions should be displayed
    const dimensionText = screen.getByText(/20\.00" × 15\.00"/i);
    expect(dimensionText).toBeInTheDocument();
  });

  it("should handle rapid state changes", async () => {
    const photo = createTestPhoto();

    const { rerender } = render(<PhotoEditor />);

    // Rapid state changes
    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
      usePhotoEditorStore.getState().movePhoto(1, 1);
      usePhotoEditorStore.getState().scalePhoto(1.1);
      usePhotoEditorStore.getState().movePhoto(-1, -1);
    });

    rerender(<PhotoEditor />);

    // Should still render without errors
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Scale")).toBeInTheDocument();
  });

  it("should show loading state across components", () => {
    const { rerender } = render(<PhotoEditor />);

    act(() => {
      usePhotoEditorStore.getState().setLoading(true);
    });

    rerender(<PhotoEditor />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    act(() => {
      usePhotoEditorStore.getState().setLoading(false);
    });

    rerender(<PhotoEditor />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("should maintain consistent state across component unmount/remount", () => {
    const photo = createTestPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { unmount } = render(<PhotoEditor />);

    expect(screen.getByText("Position")).toBeInTheDocument();

    unmount();

    // Store should maintain state
    expect(usePhotoEditorStore.getState().photo).toBe(photo);

    // Remount
    render(<PhotoEditor />);

    // State should be reflected in new render
    expect(screen.getByText("Position")).toBeInTheDocument();
  });

  it("should handle clearing photo and updating all components", () => {
    const photo = createTestPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { rerender } = render(<PhotoEditor />);

    expect(screen.getByText("Position")).toBeInTheDocument();

    // Clear photo
    act(() => {
      usePhotoEditorStore.getState().clearPhoto();
    });

    rerender(<PhotoEditor />);

    // Controls should be hidden
    expect(screen.queryByText("Position")).not.toBeInTheDocument();
    expect(screen.queryByText("Scale")).not.toBeInTheDocument();
    expect(screen.queryByText("Print & Export")).not.toBeInTheDocument();

    // Error should be cleared
    expect(usePhotoEditorStore.getState().error).toBeNull();

    // Coverage should be false
    expect(usePhotoEditorStore.getState().isCovered).toBe(false);
  });

  it("should update photo dimensions display when scaling", async () => {
    const photo = createTestPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { rerender } = render(<PhotoEditor />);

    // Initial dimensions
    expect(screen.getByText(/20\.00" × 15\.00"/i)).toBeInTheDocument();

    // Scale up
    act(() => {
      usePhotoEditorStore.getState().scalePhoto(1.5);
    });

    rerender(<PhotoEditor />);

    // Dimensions should update
    expect(screen.getByText(/30\.00" × 22\.50"/i)).toBeInTheDocument();
  });
});
