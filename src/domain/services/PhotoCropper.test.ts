import { describe, it, expect } from "vitest";
import { PhotoCropper } from "./PhotoCropper";
import { Photo } from "@domain/entities/Photo";
import { Canvas } from "@domain/entities/Canvas";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";

describe("PhotoCropper", () => {
  const canvas = Canvas.PRINT_CANVAS; // 15" x 10"

  const createPhoto = (
    width: number,
    height: number,
    x: number,
    y: number,
  ): Photo => {
    return new Photo(
      "test-id",
      "data:image/png;base64,test",
      new Dimensions(width, height),
      new Position(x, y),
      new Dimensions(width, height),
    );
  };

  describe("getCroppedArea()", () => {
    describe("photo larger than canvas with negative position", () => {
      it("should calculate cropped area for centered oversized photo", () => {
        const photo = createPhoto(20, 15, -2.5, -2.5);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(2.5); // Crop 2.5" from left
        expect(croppedArea.startY).toBe(2.5); // Crop 2.5" from top
        expect(croppedArea.width).toBe(15); // Canvas width
        expect(croppedArea.height).toBe(10); // Canvas height
      });

      it("should handle photo with more overhang on left and top", () => {
        const photo = createPhoto(25, 20, -5, -5);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(5);
        expect(croppedArea.startY).toBe(5);
        expect(croppedArea.width).toBe(15);
        expect(croppedArea.height).toBe(10);
      });
    });

    describe("photo at origin (0, 0)", () => {
      it("should calculate cropped area for photo at origin", () => {
        const photo = createPhoto(20, 15, 0, 0);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(0);
        expect(croppedArea.startY).toBe(0);
        expect(croppedArea.width).toBe(15);
        expect(croppedArea.height).toBe(10);
      });

      it("should handle photo exactly matching canvas size at origin", () => {
        const photo = createPhoto(15, 10, 0, 0);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(0);
        expect(croppedArea.startY).toBe(0);
        expect(croppedArea.width).toBe(15);
        expect(croppedArea.height).toBe(10);
      });
    });

    describe("photo partially outside canvas boundaries", () => {
      it("should handle photo extending beyond right edge", () => {
        const photo = createPhoto(20, 12, -3, -1);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(3);
        expect(croppedArea.startY).toBe(1);
        expect(croppedArea.width).toBe(15);
        expect(croppedArea.height).toBe(10);
      });

      it("should handle photo extending beyond bottom edge", () => {
        const photo = createPhoto(18, 15, -1.5, -2);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(1.5);
        expect(croppedArea.startY).toBe(2);
        expect(croppedArea.width).toBe(15);
        expect(croppedArea.height).toBe(10);
      });
    });

    describe("photo smaller than canvas", () => {
      it("should calculate cropped area for small photo at origin", () => {
        const photo = createPhoto(10, 8, 0, 0);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(0);
        expect(croppedArea.startY).toBe(0);
        expect(croppedArea.width).toBe(10); // Limited by photo width
        expect(croppedArea.height).toBe(8); // Limited by photo height
      });

      it("should handle small photo with positive position", () => {
        const photo = createPhoto(5, 5, 2, 2);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(0);
        expect(croppedArea.startY).toBe(0);
        expect(croppedArea.width).toBe(5);
        expect(croppedArea.height).toBe(5);
      });
    });

    describe("edge cases", () => {
      it("should handle photo with minimal negative offset", () => {
        const photo = createPhoto(15.1, 10.1, -0.05, -0.05);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBeCloseTo(0.05);
        expect(croppedArea.startY).toBeCloseTo(0.05);
        expect(croppedArea.width).toBeCloseTo(15);
        expect(croppedArea.height).toBeCloseTo(10);
      });

      it("should handle very large photo", () => {
        const photo = createPhoto(100, 100, -42.5, -45);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(42.5);
        expect(croppedArea.startY).toBe(45);
        expect(croppedArea.width).toBe(15);
        expect(croppedArea.height).toBe(10);
      });

      it("should handle photo positioned far outside canvas", () => {
        const photo = createPhoto(5, 5, 20, 15);

        const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

        expect(croppedArea.startX).toBe(0);
        expect(croppedArea.startY).toBe(0);
        // Photo is completely outside canvas
        expect(croppedArea.width).toBeLessThanOrEqual(0);
        expect(croppedArea.height).toBeLessThanOrEqual(0);
      });
    });
  });

  describe("croppedAreaToPixels()", () => {
    it("should convert inches to pixels at 300 DPI", () => {
      const croppedArea = {
        startX: 2.5,
        startY: 2.5,
        width: 15,
        height: 10,
      };
      const sourcePixelWidth = 6000; // 20" * 300 DPI
      const sourcePixelHeight = 4500; // 15" * 300 DPI
      const photoDimensionsInches = { width: 20, height: 15 };

      const pixelArea = PhotoCropper.croppedAreaToPixels(
        croppedArea,
        sourcePixelWidth,
        sourcePixelHeight,
        photoDimensionsInches,
      );

      expect(pixelArea.x).toBe(750); // 2.5 * 300
      expect(pixelArea.y).toBe(750); // 2.5 * 300
      expect(pixelArea.width).toBe(4500); // 15 * 300
      expect(pixelArea.height).toBe(3000); // 10 * 300
    });

    it("should handle different aspect ratios", () => {
      const croppedArea = {
        startX: 1,
        startY: 1,
        width: 10,
        height: 5,
      };
      const sourcePixelWidth = 3000; // 10" * 300 DPI
      const sourcePixelHeight = 3000; // 10" * 300 DPI (square image)
      const photoDimensionsInches = { width: 10, height: 10 };

      const pixelArea = PhotoCropper.croppedAreaToPixels(
        croppedArea,
        sourcePixelWidth,
        sourcePixelHeight,
        photoDimensionsInches,
      );

      expect(pixelArea.x).toBe(300); // 1 * 300
      expect(pixelArea.y).toBe(300); // 1 * 300
      expect(pixelArea.width).toBe(3000); // 10 * 300
      expect(pixelArea.height).toBe(1500); // 5 * 300
    });

    it("should handle non-standard DPI (72 DPI example)", () => {
      const croppedArea = {
        startX: 5,
        startY: 5,
        width: 15,
        height: 10,
      };
      // Image is 72 DPI
      const sourcePixelWidth = 1440; // 20" * 72 DPI
      const sourcePixelHeight = 1080; // 15" * 72 DPI
      const photoDimensionsInches = { width: 20, height: 15 };

      const pixelArea = PhotoCropper.croppedAreaToPixels(
        croppedArea,
        sourcePixelWidth,
        sourcePixelHeight,
        photoDimensionsInches,
      );

      expect(pixelArea.x).toBe(360); // 5 * 72
      expect(pixelArea.y).toBe(360); // 5 * 72
      expect(pixelArea.width).toBe(1080); // 15 * 72
      expect(pixelArea.height).toBe(720); // 10 * 72
    });

    it("should maintain correct scaling for partial crops", () => {
      const croppedArea = {
        startX: 2.5,
        startY: 2.5,
        width: 7.5,
        height: 5,
      };
      const sourcePixelWidth = 3000; // 10" * 300 DPI
      const sourcePixelHeight = 3000; // 10" * 300 DPI
      const photoDimensionsInches = { width: 10, height: 10 };

      const pixelArea = PhotoCropper.croppedAreaToPixels(
        croppedArea,
        sourcePixelWidth,
        sourcePixelHeight,
        photoDimensionsInches,
      );

      expect(pixelArea.x).toBe(750);
      expect(pixelArea.y).toBe(750);
      expect(pixelArea.width).toBe(2250);
      expect(pixelArea.height).toBe(1500);
    });

    it("should handle decimal dimensions accurately", () => {
      const croppedArea = {
        startX: 1.5,
        startY: 2.25,
        width: 10.5,
        height: 7.75,
      };
      const sourcePixelWidth = 4500; // 15" * 300 DPI
      const sourcePixelHeight = 3000; // 10" * 300 DPI
      const photoDimensionsInches = { width: 15, height: 10 };

      const pixelArea = PhotoCropper.croppedAreaToPixels(
        croppedArea,
        sourcePixelWidth,
        sourcePixelHeight,
        photoDimensionsInches,
      );

      expect(pixelArea.x).toBe(450); // 1.5 * 300
      expect(pixelArea.y).toBe(675); // 2.25 * 300
      expect(pixelArea.width).toBe(3150); // 10.5 * 300
      expect(pixelArea.height).toBe(2325); // 7.75 * 300
    });

    it("should handle zero start position", () => {
      const croppedArea = {
        startX: 0,
        startY: 0,
        width: 15,
        height: 10,
      };
      const sourcePixelWidth = 4500;
      const sourcePixelHeight = 3000;
      const photoDimensionsInches = { width: 15, height: 10 };

      const pixelArea = PhotoCropper.croppedAreaToPixels(
        croppedArea,
        sourcePixelWidth,
        sourcePixelHeight,
        photoDimensionsInches,
      );

      expect(pixelArea.x).toBe(0);
      expect(pixelArea.y).toBe(0);
      expect(pixelArea.width).toBe(4500);
      expect(pixelArea.height).toBe(3000);
    });

    it("should maintain aspect ratio in conversion", () => {
      const croppedArea = {
        startX: 0,
        startY: 0,
        width: 16,
        height: 9,
      };
      const sourcePixelWidth = 4800; // 16" * 300 DPI
      const sourcePixelHeight = 2700; // 9" * 300 DPI
      const photoDimensionsInches = { width: 16, height: 9 };

      const pixelArea = PhotoCropper.croppedAreaToPixels(
        croppedArea,
        sourcePixelWidth,
        sourcePixelHeight,
        photoDimensionsInches,
      );

      const originalAspect = croppedArea.width / croppedArea.height;
      const pixelAspect = pixelArea.width / pixelArea.height;

      expect(pixelAspect).toBeCloseTo(originalAspect, 5);
    });
  });

  describe("integration: getCroppedArea + croppedAreaToPixels", () => {
    it("should correctly convert full workflow from photo to pixels", () => {
      const photo = createPhoto(20, 15, -2.5, -2.5);
      const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

      const sourcePixelWidth = 6000; // 20" * 300 DPI
      const sourcePixelHeight = 4500; // 15" * 300 DPI

      const pixelArea = PhotoCropper.croppedAreaToPixels(
        croppedArea,
        sourcePixelWidth,
        sourcePixelHeight,
        { width: 20, height: 15 },
      );

      // Should crop 2.5" from each side and show the center 15"x10"
      expect(pixelArea.x).toBe(750);
      expect(pixelArea.y).toBe(750);
      expect(pixelArea.width).toBe(4500);
      expect(pixelArea.height).toBe(3000);
    });
  });
});
