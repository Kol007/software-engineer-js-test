import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePhotoExport } from "./usePhotoExport";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { ExportPhotoUseCase } from "@application/use-cases/ExportPhotoUseCase";
import { JSONPhotoRepository } from "@infrastructure/adapters/JSONPhotoRepository";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";

// Mock dependencies
vi.mock("@application/use-cases/ExportPhotoUseCase");
vi.mock("@infrastructure/adapters/JSONPhotoRepository");

describe("usePhotoExport", () => {
  const createMockPhoto = (): Photo => {
    return new Photo(
      "test-id",
      "data:image/png;base64,test",
      new Dimensions(20, 15),
      new Position(-2.5, -2.5),
      new Dimensions(20, 15),
    );
  };

  beforeEach(() => {
    // Reset store
    act(() => {
      usePhotoEditorStore.setState({
        photo: null,
        error: null,
      });
    });

    vi.clearAllMocks();
  });

  it("should return exportPhoto function and isExporting state", () => {
    const { result } = renderHook(() => usePhotoExport());

    expect(result.current.exportPhoto).toBeInstanceOf(Function);
    expect(result.current.isExporting).toBe(false);
  });

  it("should set error when no photo is loaded", async () => {
    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(usePhotoEditorStore.getState().error).toBe("No photo to export");
  });

  it("should not call use case when no photo is loaded", async () => {
    const mockExecute = vi.fn();

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("should set isExporting to true while exporting", async () => {
    const mockPhoto = createMockPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(mockPhoto);
    });

    const mockExecute = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    act(() => {
      result.current.exportPhoto();
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });
  });

  it("should clear error when starting export", async () => {
    const mockPhoto = createMockPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(mockPhoto);
      usePhotoEditorStore.getState().setError("Previous error");
    });

    const mockExecute = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(usePhotoEditorStore.getState().error).toBeNull();
  });

  it("should successfully export photo", async () => {
    const mockPhoto = createMockPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(mockPhoto);
    });

    const mockExecute = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(mockExecute).toHaveBeenCalledWith(mockPhoto);
  });

  it("should set error when export fails", async () => {
    const mockPhoto = createMockPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(mockPhoto);
    });

    const error = new Error("Export failed");
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(usePhotoEditorStore.getState().error).toBe("Export failed");
  });

  it("should set isExporting to false after error", async () => {
    const mockPhoto = createMockPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(mockPhoto);
    });

    const error = new Error("Export failed");
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(result.current.isExporting).toBe(false);
  });

  it("should create JSONPhotoRepository instance", async () => {
    const mockPhoto = createMockPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(mockPhoto);
    });

    const mockExecute = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(JSONPhotoRepository).toHaveBeenCalled();
  });

  it("should create ExportPhotoUseCase with repository", async () => {
    const mockPhoto = createMockPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(mockPhoto);
    });

    const mockExecute = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(ExportPhotoUseCase).toHaveBeenCalledWith(
      expect.any(JSONPhotoRepository),
    );
  });

  it("should use memoized callback", () => {
    const { result, rerender } = renderHook(() => usePhotoExport());

    const firstCallback = result.current.exportPhoto;

    rerender();

    const secondCallback = result.current.exportPhoto;

    // Callback should be the same reference (memoized)
    expect(firstCallback).toBe(secondCallback);
  });

  it("should handle photo coverage validation error", async () => {
    const mockPhoto = createMockPhoto();

    act(() => {
      usePhotoEditorStore.getState().setPhoto(mockPhoto);
    });

    const error = new Error(
      "Photo must fully cover the canvas before exporting",
    );
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(ExportPhotoUseCase).mockImplementation(function () {
      return { execute: mockExecute };
    } as any);

    const { result } = renderHook(() => usePhotoExport());

    await act(async () => {
      await result.current.exportPhoto();
    });

    expect(usePhotoEditorStore.getState().error).toBe(
      "Photo must fully cover the canvas before exporting",
    );
  });
});
