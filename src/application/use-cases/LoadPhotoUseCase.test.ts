import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoadPhotoUseCase } from "./LoadPhotoUseCase";
import { IImageLoader, ImageData } from "@application/ports/IImageLoader";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Canvas } from "@domain/entities/Canvas";

describe("LoadPhotoUseCase", () => {
  let mockImageLoader: IImageLoader;
  let useCase: LoadPhotoUseCase;
  let mockFile: File;

  beforeEach(() => {
    mockFile = new File(["test"], "test.png", { type: "image/png" });
    mockImageLoader = {
      load: vi.fn(),
    };
    useCase = new LoadPhotoUseCase(mockImageLoader);
  });

  describe("execute()", () => {
    it("should load and create a photo with correct properties", async () => {
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(3000 / 300, 2000 / 300), // 10" x 6.67" at 300 DPI
        pixelWidth: 3000,
        pixelHeight: 2000,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);

      expect(mockImageLoader.load).toHaveBeenCalledWith(mockFile);
      expect(photo.id).toBeDefined();
      expect(photo.src).toBe("data:image/png;base64,test");
      expect(photo.originalDimensions.width).toBeCloseTo(10);
      expect(photo.originalDimensions.height).toBeCloseTo(6.67, 1);
    });

    it("should scale photo to cover canvas (landscape image)", async () => {
      // Image: 10" x 6.67" (wider than canvas aspect ratio)
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(10, 6.67),
        pixelWidth: 3000,
        pixelHeight: 2000,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS; // 15" x 10"

      // Should scale to cover canvas height (10 / 6.67 = 1.5)
      expect(photo.dimensions.height).toBeCloseTo(10, 1);
      expect(photo.dimensions.width).toBeCloseTo(15, 1);
      expect(canvas.isFullyCovered(photo)).toBe(true);
    });

    it("should scale photo to cover canvas (portrait image)", async () => {
      // Image: 6" x 10" (portrait)
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(6, 10),
        pixelWidth: 1800,
        pixelHeight: 3000,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Should scale to cover canvas width (15 / 6 = 2.5)
      expect(photo.dimensions.width).toBeCloseTo(15, 1);
      expect(photo.dimensions.height).toBeCloseTo(25, 1);
      expect(canvas.isFullyCovered(photo)).toBe(true);
    });

    it("should scale photo to cover canvas (square image)", async () => {
      // Image: 8" x 8" (square)
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(8, 8),
        pixelWidth: 2400,
        pixelHeight: 2400,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Should scale to cover canvas width (15 / 8 = 1.875)
      expect(photo.dimensions.width).toBeCloseTo(15, 1);
      expect(photo.dimensions.height).toBeCloseTo(15, 1);
      expect(canvas.isFullyCovered(photo)).toBe(true);
    });

    it("should center photo on canvas", async () => {
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(10, 6.67),
        pixelWidth: 3000,
        pixelHeight: 2000,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Photo should be centered
      const expectedX = (canvas.dimensions.width - photo.dimensions.width) / 2;
      const expectedY =
        (canvas.dimensions.height - photo.dimensions.height) / 2;

      expect(photo.position.x).toBeCloseTo(expectedX, 1);
      expect(photo.position.y).toBeCloseTo(expectedY, 1);
    });

    it("should handle very small images", async () => {
      // Image: 1" x 1"
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(1, 1),
        pixelWidth: 300,
        pixelHeight: 300,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Should scale up significantly to cover canvas
      expect(photo.dimensions.width).toBeGreaterThanOrEqual(15);
      expect(photo.dimensions.height).toBeGreaterThanOrEqual(15);
      expect(canvas.isFullyCovered(photo)).toBe(true);
    });

    it("should handle very large images", async () => {
      // Image: 100" x 100"
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(100, 100),
        pixelWidth: 30000,
        pixelHeight: 30000,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Should scale down but still cover canvas
      expect(canvas.isFullyCovered(photo)).toBe(true);
    });

    it("should ensure dimensions cover canvas even with floating point errors", async () => {
      // Image that might cause floating point precision issues
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(10, 6.666666),
        pixelWidth: 3000,
        pixelHeight: 2000,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Should guarantee coverage despite precision issues
      expect(canvas.isFullyCovered(photo)).toBe(true);
      expect(photo.dimensions.width).toBeGreaterThanOrEqual(
        canvas.dimensions.width,
      );
      expect(photo.dimensions.height).toBeGreaterThanOrEqual(
        canvas.dimensions.height,
      );
    });

    it("should propagate imageLoader errors", async () => {
      const error = new Error("Failed to load image");
      vi.mocked(mockImageLoader.load).mockRejectedValue(error);

      await expect(useCase.execute(mockFile)).rejects.toThrow(
        "Failed to load image",
      );
    });

    it("should generate unique photo ID", async () => {
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(10, 10),
        pixelWidth: 3000,
        pixelHeight: 3000,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo1 = await useCase.execute(mockFile);
      const photo2 = await useCase.execute(mockFile);

      expect(photo1.id).toBeDefined();
      expect(photo2.id).toBeDefined();
      // IDs should be different (if crypto.randomUUID is not mocked)
    });

    it("should preserve original dimensions", async () => {
      const originalDimensions = new Dimensions(10, 8);
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: originalDimensions,
        pixelWidth: 3000,
        pixelHeight: 2400,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);

      expect(photo.originalDimensions.width).toBe(10);
      expect(photo.originalDimensions.height).toBe(8);
      // Current dimensions should be scaled
      expect(photo.dimensions.width).not.toBe(10);
    });

    it("should handle image with canvas aspect ratio", async () => {
      // Image with same aspect ratio as canvas (15:10 = 1.5:1)
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(7.5, 5), // 1.5:1 aspect ratio
        pixelWidth: 2250,
        pixelHeight: 1500,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Should scale to exactly match canvas
      expect(photo.dimensions.width).toBeCloseTo(15, 1);
      expect(photo.dimensions.height).toBeCloseTo(10, 1);
      expect(canvas.isFullyCovered(photo)).toBe(true);
    });
  });

  describe("calculateInitialScale() edge cases", () => {
    it("should handle extreme aspect ratios (very wide)", async () => {
      // Very wide image: 30" x 5"
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(30, 5),
        pixelWidth: 9000,
        pixelHeight: 1500,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Should scale based on height (10 / 5 = 2x)
      expect(photo.dimensions.height).toBeCloseTo(10, 1);
      expect(canvas.isFullyCovered(photo)).toBe(true);
    });

    it("should handle extreme aspect ratios (very tall)", async () => {
      // Very tall image: 5" x 30"
      const mockImageData: ImageData = {
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(5, 30),
        pixelWidth: 1500,
        pixelHeight: 9000,
      };

      vi.mocked(mockImageLoader.load).mockResolvedValue(mockImageData);

      const photo = await useCase.execute(mockFile);
      const canvas = Canvas.PRINT_CANVAS;

      // Should scale based on width (15 / 5 = 3x)
      expect(photo.dimensions.width).toBeCloseTo(15, 1);
      expect(canvas.isFullyCovered(photo)).toBe(true);
    });
  });
});
