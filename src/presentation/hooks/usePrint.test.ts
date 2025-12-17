import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePrint } from "./usePrint";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";

describe("usePrint", () => {
  let mockPrint: ReturnType<typeof vi.fn>;

  const createMockPhoto = (
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
    // Mock window.print
    mockPrint = vi.fn();
    global.print = mockPrint;

    // Reset store
    act(() => {
      usePhotoEditorStore.setState({
        photo: null,
        isCovered: false,
        error: null,
      });
    });

    vi.clearAllMocks();
  });

  it("should return handlePrint function and canPrint state", () => {
    const { result } = renderHook(() => usePrint());

    expect(result.current.handlePrint).toBeInstanceOf(Function);
    expect(result.current.canPrint).toBe(false);
  });

  it("should set canPrint to false when no photo is loaded", () => {
    const { result } = renderHook(() => usePrint());

    expect(result.current.canPrint).toBe(false);
  });

  it("should set canPrint to false when photo doesn't cover canvas", () => {
    const photo = createMockPhoto(10, 8, 0, 0); // Non-covering photo

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result } = renderHook(() => usePrint());

    expect(result.current.canPrint).toBe(false);
  });

  it("should set canPrint to true when photo covers canvas", () => {
    const photo = createMockPhoto(20, 15, -2.5, -2.5); // Covering photo

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result } = renderHook(() => usePrint());

    expect(result.current.canPrint).toBe(true);
  });

  it("should set error when trying to print with no photo", () => {
    const { result } = renderHook(() => usePrint());

    act(() => {
      result.current.handlePrint();
    });

    expect(usePhotoEditorStore.getState().error).toBe(
      "No photo loaded. Please load a photo first.",
    );
  });

  it("should not call window.print when no photo is loaded", () => {
    const { result } = renderHook(() => usePrint());

    act(() => {
      result.current.handlePrint();
    });

    expect(mockPrint).not.toHaveBeenCalled();
  });

  it("should set error when trying to print photo that doesn't cover canvas", () => {
    const photo = createMockPhoto(10, 8, 0, 0);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result } = renderHook(() => usePrint());

    act(() => {
      result.current.handlePrint();
    });

    expect(usePhotoEditorStore.getState().error).toBe(
      "Photo must cover the entire canvas before printing.",
    );
  });

  it("should not call window.print when photo doesn't cover canvas", () => {
    const photo = createMockPhoto(10, 8, 0, 0);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result } = renderHook(() => usePrint());

    act(() => {
      result.current.handlePrint();
    });

    expect(mockPrint).not.toHaveBeenCalled();
  });

  it("should call window.print when photo covers canvas", () => {
    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result } = renderHook(() => usePrint());

    act(() => {
      result.current.handlePrint();
    });

    expect(mockPrint).toHaveBeenCalled();
  });

  it("should clear error when printing valid photo", () => {
    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
      usePhotoEditorStore.getState().setError("Previous error");
    });

    const { result } = renderHook(() => usePrint());

    act(() => {
      result.current.handlePrint();
    });

    expect(usePhotoEditorStore.getState().error).toBeNull();
  });

  it("should clear error when isCovered becomes true", () => {
    act(() => {
      usePhotoEditorStore.getState().setError("Some error");
    });

    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    renderHook(() => usePrint());

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    expect(usePhotoEditorStore.getState().error).toBeNull();
  });

  it("should update canPrint when photo is added", () => {
    const { result } = renderHook(() => usePrint());

    expect(result.current.canPrint).toBe(false);

    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    expect(result.current.canPrint).toBe(true);
  });

  it("should update canPrint when photo is removed", () => {
    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result } = renderHook(() => usePrint());

    expect(result.current.canPrint).toBe(true);

    act(() => {
      usePhotoEditorStore.getState().clearPhoto();
    });

    expect(result.current.canPrint).toBe(false);
  });

  it("should update canPrint when photo is moved to non-covering position", () => {
    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result } = renderHook(() => usePrint());

    expect(result.current.canPrint).toBe(true);

    act(() => {
      usePhotoEditorStore.getState().movePhoto(5, 5); // Move to non-covering position
    });

    expect(result.current.canPrint).toBe(false);
  });

  it("should update canPrint when photo is scaled to non-covering size", () => {
    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result } = renderHook(() => usePrint());

    expect(result.current.canPrint).toBe(true);

    act(() => {
      usePhotoEditorStore.getState().scalePhoto(0.5); // Scale to non-covering size
    });

    expect(result.current.canPrint).toBe(false);
  });

  it("should use memoized callback", () => {
    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    const { result, rerender } = renderHook(() => usePrint());

    const firstCallback = result.current.handlePrint;

    rerender();

    const secondCallback = result.current.handlePrint;

    // Callback should be the same reference (memoized)
    expect(firstCallback).toBe(secondCallback);
  });

  it("should derive canPrint from photo and isCovered", () => {
    const { result } = renderHook(() => usePrint());

    // No photo, not covered
    expect(result.current.canPrint).toBe(false);

    // Add covering photo
    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    act(() => {
      usePhotoEditorStore.getState().setPhoto(photo);
    });

    expect(result.current.canPrint).toBe(true);
  });
});
