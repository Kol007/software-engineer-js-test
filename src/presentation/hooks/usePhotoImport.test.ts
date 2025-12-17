import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePhotoImport } from "./usePhotoImport";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { ImportPhotoUseCase } from "@application/use-cases/ImportPhotoUseCase";
import { JSONPhotoRepository } from "@infrastructure/adapters/JSONPhotoRepository";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";

// Mock dependencies
vi.mock("@application/use-cases/ImportPhotoUseCase");
vi.mock("@infrastructure/adapters/JSONPhotoRepository");

describe("usePhotoImport", () => {
  let mockFile: File;

  const createMockPhoto = (): Photo => {
    return new Photo(
      "imported-id",
      "data:image/png;base64,imported",
      new Dimensions(20, 15),
      new Position(-2.5, -2.5),
      new Dimensions(20, 15),
    );
  };

  beforeEach(() => {
    mockFile = new File(['{"canvas":{}}'], "photo.json", {
      type: "application/json",
    });

    // Reset store
    act(() => {
      usePhotoEditorStore.setState({
        photo: null,
        error: null,
      });
    });

    vi.clearAllMocks();
  });

  it("should return importPhoto function and isImporting state", () => {
    const { result } = renderHook(() => usePhotoImport());

    expect(result.current.importPhoto).toBeInstanceOf(Function);
    expect(result.current.isImporting).toBe(false);
  });

  it("should set isImporting to true while importing", async () => {
    const mockPhoto = createMockPhoto();
    const mockExecute = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockPhoto), 100)),
      );

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    act(() => {
      result.current.importPhoto(mockFile);
    });

    expect(result.current.isImporting).toBe(true);

    await waitFor(() => {
      expect(result.current.isImporting).toBe(false);
    });
  });

  it("should successfully import photo", async () => {
    const mockPhoto = createMockPhoto();
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(mockExecute).toHaveBeenCalledWith(mockFile);
    expect(usePhotoEditorStore.getState().photo).toBe(mockPhoto);
  });

  it("should set error when import fails", async () => {
    const error = new Error("Invalid JSON format");
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(usePhotoEditorStore.getState().error).toBe("Invalid JSON format");
  });

  it("should set isImporting to false after error", async () => {
    const error = new Error("Import failed");
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(result.current.isImporting).toBe(false);
  });

  it("should set isImporting to false after successful import", async () => {
    const mockPhoto = createMockPhoto();
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(result.current.isImporting).toBe(false);
  });

  it("should create JSONPhotoRepository instance", async () => {
    const mockPhoto = createMockPhoto();
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(JSONPhotoRepository).toHaveBeenCalled();
  });

  it("should create ImportPhotoUseCase with repository", async () => {
    const mockPhoto = createMockPhoto();
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(ImportPhotoUseCase).toHaveBeenCalledWith(
      expect.any(JSONPhotoRepository),
    );
  });

  it("should handle file type validation error", async () => {
    const error = new Error("File must be a JSON file");
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(usePhotoEditorStore.getState().error).toBe(
      "File must be a JSON file",
    );
  });

  it("should handle invalid photo description error", async () => {
    const error = new Error("Invalid photo description format");
    const mockExecute = vi.fn().mockRejectedValue(error);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(usePhotoEditorStore.getState().error).toBe(
      "Invalid photo description format",
    );
  });

  it("should handle multiple consecutive imports", async () => {
    const mockPhoto1 = createMockPhoto();
    const mockPhoto2 = new Photo(
      "imported-id-2",
      "data:image/png;base64,imported2",
      new Dimensions(25, 20),
      new Position(-5, -5),
      new Dimensions(25, 20),
    );

    const mockExecute = vi
      .fn()
      .mockResolvedValueOnce(mockPhoto1)
      .mockResolvedValueOnce(mockPhoto2);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(usePhotoEditorStore.getState().photo).toBe(mockPhoto1);

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(usePhotoEditorStore.getState().photo).toBe(mockPhoto2);
  });

  it("should use memoized callback", () => {
    const { result, rerender } = renderHook(() => usePhotoImport());

    const firstCallback = result.current.importPhoto;

    rerender();

    const secondCallback = result.current.importPhoto;

    // Callback should be the same reference (memoized)
    expect(firstCallback).toBe(secondCallback);
  });

  it("should call setPhoto with imported photo", async () => {
    const mockPhoto = createMockPhoto();
    const mockExecute = vi.fn().mockResolvedValue(mockPhoto);

    vi.mocked(ImportPhotoUseCase).mockImplementation(function (this: any) {
      this.execute = mockExecute;
    } as any);

    const setPhotoSpy = vi.spyOn(usePhotoEditorStore.getState(), "setPhoto");

    const { result } = renderHook(() => usePhotoImport());

    await act(async () => {
      await result.current.importPhoto(mockFile);
    });

    expect(setPhotoSpy).toHaveBeenCalledWith(mockPhoto);
  });
});
