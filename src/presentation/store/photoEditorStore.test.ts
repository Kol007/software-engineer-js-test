import { describe, it, expect, beforeEach } from "vitest";
import { usePhotoEditorStore } from "./photoEditorStore";
import { Photo } from "@domain/entities/Photo";
import { Canvas } from "@domain/entities/Canvas";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";
import { act } from "@testing-library/react";

describe("photoEditorStore", () => {
  const createTestPhoto = (
    width = 20,
    height = 15,
    x = -2.5,
    y = -2.5,
  ): Photo => {
    return new Photo(
      "test-id",
      "data:image/png;base64,test",
      new Dimensions(width, height),
      new Position(x, y),
      new Dimensions(width, height),
    );
  };

  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      usePhotoEditorStore.setState({
        photo: null,
        canvas: Canvas.PRINT_CANVAS,
        isLoading: false,
        error: null,
        isCovered: false,
      });
    });
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = usePhotoEditorStore.getState();

      expect(state.photo).toBeNull();
      expect(state.canvas).toBe(Canvas.PRINT_CANVAS);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isCovered).toBe(false);
    });

    it("should have canvas dimensions of 15x10", () => {
      const state = usePhotoEditorStore.getState();

      expect(state.canvas.dimensions.width).toBe(15);
      expect(state.canvas.dimensions.height).toBe(10);
    });
  });

  describe("setPhoto action", () => {
    it("should set photo in state", () => {
      const photo = createTestPhoto();

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo).toBe(photo);
    });

    it("should clear error when setting photo", () => {
      act(() => {
        usePhotoEditorStore.getState().setError("Some error");
      });

      const photo = createTestPhoto();

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.error).toBeNull();
    });

    it("should calculate isCovered as true for covering photo", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.isCovered).toBe(true);
    });

    it("should calculate isCovered as false for non-covering photo", () => {
      const photo = createTestPhoto(10, 8, 0, 0);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.isCovered).toBe(false);
    });

    it("should update isCovered when photo changes", () => {
      const coveringPhoto = createTestPhoto(20, 15, -2.5, -2.5);
      const nonCoveringPhoto = createTestPhoto(10, 8, 0, 0);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(coveringPhoto);
      });

      expect(usePhotoEditorStore.getState().isCovered).toBe(true);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(nonCoveringPhoto);
      });

      expect(usePhotoEditorStore.getState().isCovered).toBe(false);
    });
  });

  describe("movePhoto action", () => {
    it("should move photo by delta", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().movePhoto(1, 1);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.position.x).toBe(-1.5);
      expect(state.photo?.position.y).toBe(-1.5);
    });

    it("should move photo left", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().movePhoto(-1, 0);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.position.x).toBe(-3.5);
      expect(state.photo?.position.y).toBe(-2.5);
    });

    it("should move photo up", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().movePhoto(0, -1);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.position.x).toBe(-2.5);
      expect(state.photo?.position.y).toBe(-3.5);
    });

    it("should recalculate isCovered after moving", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      expect(usePhotoEditorStore.getState().isCovered).toBe(true);

      act(() => {
        usePhotoEditorStore.getState().movePhoto(5, 5); // Move to non-covering position
      });

      const state = usePhotoEditorStore.getState();

      expect(state.isCovered).toBe(false);
    });

    it("should do nothing if photo is null", () => {
      act(() => {
        usePhotoEditorStore.getState().movePhoto(1, 1);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo).toBeNull();
    });

    it("should handle negative deltas", () => {
      const photo = createTestPhoto(20, 15, 0, 0);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().movePhoto(-5, -5);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.position.x).toBe(-5);
      expect(state.photo?.position.y).toBe(-5);
    });

    it("should handle decimal deltas", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().movePhoto(0.25, 0.75);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.position.x).toBe(-2.25);
      expect(state.photo?.position.y).toBe(-1.75);
    });
  });

  describe("scalePhoto action", () => {
    it("should scale photo by factor", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().scalePhoto(2);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.dimensions.width).toBe(40);
      expect(state.photo?.dimensions.height).toBe(30);
    });

    it("should scale down with factor < 1", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().scalePhoto(0.5);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.dimensions.width).toBe(10);
      expect(state.photo?.dimensions.height).toBe(7.5);
    });

    it("should recalculate isCovered after scaling", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      expect(usePhotoEditorStore.getState().isCovered).toBe(true);

      act(() => {
        usePhotoEditorStore.getState().scalePhoto(0.5); // Scale down to non-covering size
      });

      const state = usePhotoEditorStore.getState();

      expect(state.isCovered).toBe(false);
    });

    it("should set error for invalid scale factor (zero)", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().scalePhoto(0);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.error).toBe("Scale factor must be positive");
      expect(state.photo?.dimensions.width).toBe(20); // Unchanged
    });

    it("should set error for invalid scale factor (negative)", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().scalePhoto(-1);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.error).toBe("Scale factor must be positive");
    });

    it("should do nothing if photo is null", () => {
      act(() => {
        usePhotoEditorStore.getState().scalePhoto(2);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo).toBeNull();
      expect(state.error).toBeNull();
    });

    it("should handle decimal scale factors", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().scalePhoto(1.5);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.dimensions.width).toBe(30);
      expect(state.photo?.dimensions.height).toBe(22.5);
    });

    it("should preserve position when scaling", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().scalePhoto(2);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo?.position.x).toBe(-2.5);
      expect(state.photo?.position.y).toBe(-2.5);
    });
  });

  describe("clearPhoto action", () => {
    it("should clear photo from state", () => {
      const photo = createTestPhoto();

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().clearPhoto();
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo).toBeNull();
    });

    it("should clear error when clearing photo", () => {
      const photo = createTestPhoto();

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().setError("Some error");
        usePhotoEditorStore.getState().clearPhoto();
      });

      const state = usePhotoEditorStore.getState();

      expect(state.error).toBeNull();
    });

    it("should set isCovered to false when clearing photo", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().clearPhoto();
      });

      const state = usePhotoEditorStore.getState();

      expect(state.isCovered).toBe(false);
    });

    it("should work when photo is already null", () => {
      act(() => {
        usePhotoEditorStore.getState().clearPhoto();
      });

      const state = usePhotoEditorStore.getState();

      expect(state.photo).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isCovered).toBe(false);
    });
  });

  describe("setLoading action", () => {
    it("should set loading to true", () => {
      act(() => {
        usePhotoEditorStore.getState().setLoading(true);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.isLoading).toBe(true);
    });

    it("should set loading to false", () => {
      act(() => {
        usePhotoEditorStore.getState().setLoading(true);
        usePhotoEditorStore.getState().setLoading(false);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.isLoading).toBe(false);
    });
  });

  describe("setError action", () => {
    it("should set error message", () => {
      act(() => {
        usePhotoEditorStore.getState().setError("Test error");
      });

      const state = usePhotoEditorStore.getState();

      expect(state.error).toBe("Test error");
    });

    it("should clear error by setting null", () => {
      act(() => {
        usePhotoEditorStore.getState().setError("Test error");
        usePhotoEditorStore.getState().setError(null);
      });

      const state = usePhotoEditorStore.getState();

      expect(state.error).toBeNull();
    });

    it("should allow updating error message", () => {
      act(() => {
        usePhotoEditorStore.getState().setError("First error");
        usePhotoEditorStore.getState().setError("Second error");
      });

      const state = usePhotoEditorStore.getState();

      expect(state.error).toBe("Second error");
    });
  });

  describe("state immutability", () => {
    it("should not mutate original photo when moving", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);
      const originalX = photo.position.x;
      const originalY = photo.position.y;

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().movePhoto(5, 5);
      });

      // Original photo should not be mutated
      expect(photo.position.x).toBe(originalX);
      expect(photo.position.y).toBe(originalY);
    });

    it("should not mutate original photo when scaling", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);
      const originalWidth = photo.dimensions.width;
      const originalHeight = photo.dimensions.height;

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().scalePhoto(2);
      });

      // Original photo should not be mutated
      expect(photo.dimensions.width).toBe(originalWidth);
      expect(photo.dimensions.height).toBe(originalHeight);
    });
  });

  describe("complex workflows", () => {
    it("should handle complete workflow: load -> move -> scale -> clear", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      expect(usePhotoEditorStore.getState().photo).toBe(photo);
      expect(usePhotoEditorStore.getState().isCovered).toBe(true);

      act(() => {
        usePhotoEditorStore.getState().movePhoto(1, 1);
      });

      expect(usePhotoEditorStore.getState().photo?.position.x).toBe(-1.5);

      act(() => {
        usePhotoEditorStore.getState().scalePhoto(1.5);
      });

      expect(usePhotoEditorStore.getState().photo?.dimensions.width).toBe(30);

      act(() => {
        usePhotoEditorStore.getState().clearPhoto();
      });

      expect(usePhotoEditorStore.getState().photo).toBeNull();
    });

    it("should handle error workflow", () => {
      const photo = createTestPhoto();

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().setError("Load error");
      });

      expect(usePhotoEditorStore.getState().error).toBe("Load error");

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      // Error should be cleared when setting new photo
      expect(usePhotoEditorStore.getState().error).toBeNull();
    });

    it("should handle loading workflow", () => {
      const photo = createTestPhoto();

      act(() => {
        usePhotoEditorStore.getState().setLoading(true);
      });

      expect(usePhotoEditorStore.getState().isLoading).toBe(true);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
        usePhotoEditorStore.getState().setLoading(false);
      });

      expect(usePhotoEditorStore.getState().isLoading).toBe(false);
      expect(usePhotoEditorStore.getState().photo).toBe(photo);
    });

    it("should maintain canvas coverage tracking through multiple operations", () => {
      const photo = createTestPhoto(20, 15, -2.5, -2.5);

      act(() => {
        usePhotoEditorStore.getState().setPhoto(photo);
      });

      expect(usePhotoEditorStore.getState().isCovered).toBe(true);

      act(() => {
        usePhotoEditorStore.getState().scalePhoto(0.7); // Scale down
      });

      expect(usePhotoEditorStore.getState().isCovered).toBe(false);

      act(() => {
        usePhotoEditorStore.getState().scalePhoto(2); // Scale back up
      });

      expect(usePhotoEditorStore.getState().isCovered).toBe(true);
    });
  });
});
