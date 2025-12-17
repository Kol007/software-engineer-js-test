import { describe, it, expect } from "vitest";
import { Canvas } from "./Canvas";
import { Photo } from "./Photo";
import { Dimensions } from "../value-objects/Dimensions";
import { Position } from "../value-objects/Position";

describe("Canvas", () => {
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

  describe("PRINT_CANVAS constant", () => {
    it("should have correct dimensions (15 x 10 inches)", () => {
      expect(Canvas.PRINT_CANVAS.dimensions.width).toBe(15);
      expect(Canvas.PRINT_CANVAS.dimensions.height).toBe(10);
    });
  });

  describe("isFullyCovered()", () => {
    const canvas = Canvas.PRINT_CANVAS;

    describe("valid coverage scenarios", () => {
      it("should return true when photo exactly matches canvas size and position", () => {
        const photo = createPhoto(15, 10, 0, 0);

        expect(canvas.isFullyCovered(photo)).toBe(true);
      });

      it("should return true when photo is larger and centered", () => {
        const photo = createPhoto(20, 15, -2.5, -2.5);

        expect(canvas.isFullyCovered(photo)).toBe(true);
      });

      it("should return true when photo is much larger than canvas", () => {
        const photo = createPhoto(30, 20, -7.5, -5);

        expect(canvas.isFullyCovered(photo)).toBe(true);
      });

      it("should return true when photo starts at negative position and covers all edges", () => {
        const photo = createPhoto(20, 15, -5, -5);

        expect(canvas.isFullyCovered(photo)).toBe(true);
      });

      it("should return true for minimal coverage (photo exactly at edges)", () => {
        const photo = createPhoto(16, 11, -1, -1);

        expect(canvas.isFullyCovered(photo)).toBe(true);
      });
    });

    describe("invalid coverage scenarios", () => {
      it("should return false when photo is smaller than canvas", () => {
        const photo = createPhoto(10, 8, 0, 0);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });

      it("should return false when photo doesn't start at or before (0,0)", () => {
        const photo = createPhoto(20, 15, 1, 0);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });

      it("should return false when photo is positioned too far right", () => {
        const photo = createPhoto(15, 10, 1, 0);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });

      it("should return false when photo is positioned too far down", () => {
        const photo = createPhoto(15, 10, 0, 1);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });

      it("should return false when photo doesn't extend to right edge", () => {
        const photo = createPhoto(14, 15, 0, -2.5);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });

      it("should return false when photo doesn't extend to bottom edge", () => {
        const photo = createPhoto(20, 9, -2.5, 0);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });

      it("should return false when photo is at origin but too small", () => {
        const photo = createPhoto(14.9, 9.9, 0, 0);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should handle photo positioned at exactly (0, 0) with exact canvas size", () => {
        const photo = createPhoto(15, 10, 0, 0);

        expect(canvas.isFullyCovered(photo)).toBe(true);
      });

      it("should handle photo with minimal overhang on all sides", () => {
        const photo = createPhoto(15.1, 10.1, -0.05, -0.05);

        expect(canvas.isFullyCovered(photo)).toBe(true);
      });

      it("should return false for photo just slightly too small", () => {
        const photo = createPhoto(14.99, 10, 0, 0);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });

      it("should handle very large photo that covers canvas", () => {
        const photo = createPhoto(100, 100, -42.5, -45);

        expect(canvas.isFullyCovered(photo)).toBe(true);
      });

      it("should handle photo with negative position that doesn't cover canvas", () => {
        const photo = createPhoto(10, 10, -5, -5);

        expect(canvas.isFullyCovered(photo)).toBe(false);
      });
    });

    describe("coverage validation logic", () => {
      it("should check left edge (x <= 0)", () => {
        const photoAtEdge = createPhoto(20, 15, 0, -2.5);
        const photoBeyondEdge = createPhoto(20, 15, 0.1, -2.5);

        expect(canvas.isFullyCovered(photoAtEdge)).toBe(true);
        expect(canvas.isFullyCovered(photoBeyondEdge)).toBe(false);
      });

      it("should check top edge (y <= 0)", () => {
        const photoAtEdge = createPhoto(20, 15, -2.5, 0);
        const photoBeyondEdge = createPhoto(20, 15, -2.5, 0.1);

        expect(canvas.isFullyCovered(photoAtEdge)).toBe(true);
        expect(canvas.isFullyCovered(photoBeyondEdge)).toBe(false);
      });

      it("should check right edge (x + width >= canvasWidth)", () => {
        const photoAtEdge = createPhoto(20, 15, -5, -2.5);
        const photoShort = createPhoto(19.9, 15, -5, -2.5);

        expect(canvas.isFullyCovered(photoAtEdge)).toBe(true);
        expect(canvas.isFullyCovered(photoShort)).toBe(false);
      });

      it("should check bottom edge (y + height >= canvasHeight)", () => {
        const photoAtEdge = createPhoto(20, 15, -2.5, -5);
        const photoShort = createPhoto(20, 14.9, -2.5, -5);

        expect(canvas.isFullyCovered(photoAtEdge)).toBe(true);
        expect(canvas.isFullyCovered(photoShort)).toBe(false);
      });
    });
  });

  describe("custom canvas dimensions", () => {
    it("should work with different canvas sizes", () => {
      const customCanvas = new Canvas(new Dimensions(20, 20));
      const photo = createPhoto(25, 25, -2.5, -2.5);

      expect(customCanvas.isFullyCovered(photo)).toBe(true);
    });

    it("should correctly validate coverage for custom canvas", () => {
      const customCanvas = new Canvas(new Dimensions(10, 5));
      const validPhoto = createPhoto(12, 6, -1, -0.5);
      const invalidPhoto = createPhoto(10, 5, 0.1, 0);

      expect(customCanvas.isFullyCovered(validPhoto)).toBe(true);
      expect(customCanvas.isFullyCovered(invalidPhoto)).toBe(false);
    });
  });
});
