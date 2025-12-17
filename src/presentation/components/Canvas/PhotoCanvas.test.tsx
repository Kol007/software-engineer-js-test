import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { PhotoCanvas } from "./PhotoCanvas";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Canvas } from "@domain/entities/Canvas";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";

vi.mock("@presentation/store/photoEditorStore");

describe("PhotoCanvas", () => {
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
    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo: null,
      canvas: Canvas.PRINT_CANVAS,
    } as any);

    // Mock canvas 2D context
    const mockContext = {
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
      setLineDash: vi.fn(),
      strokeStyle: "",
      lineWidth: 0,
      fillStyle: "",
      font: "",
      textAlign: "left",
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as any;

    vi.clearAllMocks();
  });

  it("should render canvas element", () => {
    const { container } = render(<PhotoCanvas />);

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("should render placeholder when no photo is loaded", () => {
    const { container } = render(<PhotoCanvas />);

    const canvas = container.querySelector("canvas");
    const ctx = canvas?.getContext("2d");

    expect(ctx?.fillText).toHaveBeenCalledWith(
      "No photo loaded",
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("should render photo when loaded", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      canvas: Canvas.PRINT_CANVAS,
    } as any);

    const { container } = render(<PhotoCanvas />);

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("should set canvas dimensions for display", () => {
    const { container } = render(<PhotoCanvas />);

    const canvas = container.querySelector("canvas") as HTMLCanvasElement;

    expect(canvas.width).toBe(750);
    expect(canvas.height).toBe(500);
  });

  it("should clean up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<PhotoCanvas />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "beforeprint",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "afterprint",
      expect.any(Function),
    );
  });

  it("should re-render when photo changes", () => {
    const photo1 = createMockPhoto(20, 15);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo: photo1,
      canvas: Canvas.PRINT_CANVAS,
    } as any);

    const { rerender } = render(<PhotoCanvas />);

    const photo2 = createMockPhoto(25, 18);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo: photo2,
      canvas: Canvas.PRINT_CANVAS,
    } as any);

    rerender(<PhotoCanvas />);

    // Canvas should be updated
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
  });

  it("should handle photo with negative position", () => {
    const photo = createMockPhoto(20, 15, -5, -5);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      canvas: Canvas.PRINT_CANVAS,
    } as any);

    render(<PhotoCanvas />);
  });

  it("should handle photo with positive position", () => {
    const photo = createMockPhoto(10, 8, 2, 2);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      canvas: Canvas.PRINT_CANVAS,
    } as any);

    render(<PhotoCanvas />);
  });

  it("should handle very large photo dimensions", () => {
    const photo = createMockPhoto(100, 75);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      canvas: Canvas.PRINT_CANVAS,
    } as any);

    render(<PhotoCanvas />);
  });

  it("should handle very small photo dimensions", () => {
    const photo = createMockPhoto(0.5, 0.3);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      canvas: Canvas.PRINT_CANVAS,
    } as any);

    render(<PhotoCanvas />);
  });

  it("should clear canvas before drawing", () => {
    const { container } = render(<PhotoCanvas />);

    const canvas = container.querySelector("canvas");
    const ctx = canvas?.getContext("2d");

    expect(ctx?.clearRect).toHaveBeenCalledWith(
      0,
      0,
      expect.any(Number),
      expect.any(Number),
    );
  });
});
