import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useImageLoader } from "./useImageLoader";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { BrowserImageLoader } from "@infrastructure/adapters/BrowserImageLoader";
import { LoadPhotoUseCase } from "@application/use-cases/LoadPhotoUseCase";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";

// Mock dependencies
vi.mock("@infrastructure/adapters/BrowserImageLoader");
vi.mock("@application/use-cases/LoadPhotoUseCase");

describe("useImageLoader", () => {
  let mockFile: File;

  beforeEach(() => {
    mockFile = new File(["test"], "test.png", { type: "image/png" });

    // Reset store
    act(() => {
      usePhotoEditorStore.setState({
        photo: null,
        isLoading: false,
        error: null,
      });
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  it("should return loadImage function", () => {
    const { result } = renderHook(() => useImageLoader());

    expect(result.current.loadImage).toBeInstanceOf(Function);
  });

  it("should set loading state while loading image", async () => {
    const mockExecute = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    act(() => {
      result.current.loadImage(mockFile);
    });

    expect(usePhotoEditorStore.getState().isLoading).toBe(true);

    await waitFor(() => {
      expect(usePhotoEditorStore.getState().isLoading).toBe(false);
    });
  });

  it("should clear error when starting to load", async () => {
    act(() => {
      usePhotoEditorStore.getState().setError("Previous error");
    });

    const mockPhoto = new Photo(
      "test",
      "data:image/png;base64,test",
      new Dimensions(15, 10),
      new Position(0, 0),
      new Dimensions(15, 10),
    );
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(usePhotoEditorStore.getState().error).toBeNull();
  });

  it("should set photo in store after successful load", async () => {
    const mockPhoto = {
      id: "test-id",
      src: "data:image/png;base64,test",
      dimensions: { width: 20, height: 15 },
      position: { x: -2.5, y: -2.5 },
    };
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(usePhotoEditorStore.getState().photo).toBe(mockPhoto);
  });

  it("should set error if loading fails", async () => {
    const error = new Error("Failed to load image");
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(usePhotoEditorStore.getState().error).toBe("Failed to load image");
  });

  it("should set loading to false after error", async () => {
    const error = new Error("Failed to load image");
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(usePhotoEditorStore.getState().isLoading).toBe(false);
  });

  it("should create BrowserImageLoader instance", async () => {
    const mockPhoto = { id: "test" };
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(BrowserImageLoader).toHaveBeenCalled();
  });

  it("should create LoadPhotoUseCase with image loader", async () => {
    const mockPhoto = { id: "test" };
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(LoadPhotoUseCase).toHaveBeenCalledWith(
      expect.any(BrowserImageLoader),
    );
  });

  it("should call use case execute with file", async () => {
    const mockPhoto = { id: "test" };
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(mockExecute).toHaveBeenCalledWith(mockFile);
  });

  it("should handle multiple consecutive loads", async () => {
    const mockPhoto1 = new Photo(
      "photo-1",
      "data:image/png;base64,test1",
      new Dimensions(15, 10),
      new Position(0, 0),
      new Dimensions(15, 10),
    );
    const mockPhoto2 = new Photo(
      "photo-2",
      "data:image/png;base64,test2",
      new Dimensions(15, 10),
      new Position(0, 0),
      new Dimensions(15, 10),
    );
    const mockExecute = vi
      .fn()
      .mockResolvedValueOnce(mockPhoto1)
      .mockResolvedValueOnce(mockPhoto2);

    vi.mocked(LoadPhotoUseCase).mockImplementation(function (this: any) {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => useImageLoader());

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(usePhotoEditorStore.getState().photo).toBe(mockPhoto1);

    await act(async () => {
      await result.current.loadImage(mockFile);
    });

    expect(usePhotoEditorStore.getState().photo).toBe(mockPhoto2);
  });

  it("should use memoized callback", () => {
    const { result, rerender } = renderHook(() => useImageLoader());

    const firstCallback = result.current.loadImage;

    rerender();

    const secondCallback = result.current.loadImage;

    // Callback should be the same reference (memoized)
    expect(firstCallback).toBe(secondCallback);
  });
});
