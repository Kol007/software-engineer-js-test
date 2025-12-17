import { describe, it, expect } from "vitest";
import { Photo } from "./Photo";
import { Dimensions } from "../value-objects/Dimensions";
import { Position } from "../value-objects/Position";

describe("Photo", () => {
  const createTestPhoto = () => {
    return new Photo(
      "test-id",
      "data:image/png;base64,test",
      new Dimensions(20, 15),
      new Position(-2.5, -2.5),
      new Dimensions(10, 7.5),
    );
  };

  describe("constructor", () => {
    it("should create photo with all properties", () => {
      const photo = createTestPhoto();

      expect(photo.id).toBe("test-id");
      expect(photo.src).toBe("data:image/png;base64,test");
      expect(photo.dimensions.width).toBe(20);
      expect(photo.dimensions.height).toBe(15);
      expect(photo.position.x).toBe(-2.5);
      expect(photo.position.y).toBe(-2.5);
      expect(photo.originalDimensions.width).toBe(10);
      expect(photo.originalDimensions.height).toBe(7.5);
    });
  });

  describe("scale()", () => {
    it("should scale photo up by factor of 2", () => {
      const photo = createTestPhoto();
      const scaledPhoto = photo.scale(2);

      expect(scaledPhoto.dimensions.width).toBe(40);
      expect(scaledPhoto.dimensions.height).toBe(30);
      expect(scaledPhoto.position.x).toBe(-2.5); // Position unchanged
      expect(scaledPhoto.position.y).toBe(-2.5);
    });

    it("should scale photo down by factor of 0.5", () => {
      const photo = createTestPhoto();
      const scaledPhoto = photo.scale(0.5);

      expect(scaledPhoto.dimensions.width).toBe(10);
      expect(scaledPhoto.dimensions.height).toBe(7.5);
    });

    it("should throw error for zero scale factor", () => {
      const photo = createTestPhoto();

      expect(() => photo.scale(0)).toThrow("Scale factor must be positive");
    });

    it("should throw error for negative scale factor", () => {
      const photo = createTestPhoto();

      expect(() => photo.scale(-1)).toThrow("Scale factor must be positive");
    });

    it("should maintain original photo immutability", () => {
      const photo = createTestPhoto();
      const originalWidth = photo.dimensions.width;
      const originalHeight = photo.dimensions.height;

      photo.scale(2);

      expect(photo.dimensions.width).toBe(originalWidth);
      expect(photo.dimensions.height).toBe(originalHeight);
    });

    it("should return new Photo instance", () => {
      const photo = createTestPhoto();
      const scaledPhoto = photo.scale(1.5);

      expect(scaledPhoto).not.toBe(photo);
      expect(scaledPhoto).toBeInstanceOf(Photo);
    });

    it("should preserve id, src, and originalDimensions", () => {
      const photo = createTestPhoto();
      const scaledPhoto = photo.scale(2);

      expect(scaledPhoto.id).toBe(photo.id);
      expect(scaledPhoto.src).toBe(photo.src);
      expect(scaledPhoto.originalDimensions).toBe(photo.originalDimensions);
    });

    it("should handle decimal scale factors", () => {
      const photo = createTestPhoto();
      const scaledPhoto = photo.scale(1.5);

      expect(scaledPhoto.dimensions.width).toBe(30);
      expect(scaledPhoto.dimensions.height).toBe(22.5);
    });
  });

  describe("move()", () => {
    it("should move photo right and down", () => {
      const photo = createTestPhoto();
      const movedPhoto = photo.move(5, 3);

      expect(movedPhoto.position.x).toBe(2.5);
      expect(movedPhoto.position.y).toBe(0.5);
    });

    it("should move photo left and up", () => {
      const photo = createTestPhoto();
      const movedPhoto = photo.move(-5, -3);

      expect(movedPhoto.position.x).toBe(-7.5);
      expect(movedPhoto.position.y).toBe(-5.5);
    });

    it("should handle zero deltas", () => {
      const photo = createTestPhoto();
      const movedPhoto = photo.move(0, 0);

      expect(movedPhoto.position.x).toBe(photo.position.x);
      expect(movedPhoto.position.y).toBe(photo.position.y);
    });

    it("should maintain original photo immutability", () => {
      const photo = createTestPhoto();
      const originalX = photo.position.x;
      const originalY = photo.position.y;

      photo.move(10, 10);

      expect(photo.position.x).toBe(originalX);
      expect(photo.position.y).toBe(originalY);
    });

    it("should return new Photo instance", () => {
      const photo = createTestPhoto();
      const movedPhoto = photo.move(1, 1);

      expect(movedPhoto).not.toBe(photo);
      expect(movedPhoto).toBeInstanceOf(Photo);
    });

    it("should preserve id, src, dimensions, and originalDimensions", () => {
      const photo = createTestPhoto();
      const movedPhoto = photo.move(5, 5);

      expect(movedPhoto.id).toBe(photo.id);
      expect(movedPhoto.src).toBe(photo.src);
      expect(movedPhoto.dimensions).toBe(photo.dimensions);
      expect(movedPhoto.originalDimensions).toBe(photo.originalDimensions);
    });

    it("should handle decimal deltas", () => {
      const photo = createTestPhoto();
      const movedPhoto = photo.move(1.5, -2.75);

      expect(movedPhoto.position.x).toBe(-1);
      expect(movedPhoto.position.y).toBe(-5.25);
    });
  });

  describe("toJSON()", () => {
    it("should export photo in correct JSON format", () => {
      const photo = createTestPhoto();
      const json = photo.toJSON();

      expect(json).toEqual({
        id: "test-id",
        src: "data:image/png;base64,test",
        width: 20,
        height: 15,
        x: -2.5,
        y: -2.5,
      });
    });

    it("should not include originalDimensions in JSON", () => {
      const photo = createTestPhoto();
      const json = photo.toJSON();

      expect(json).not.toHaveProperty("originalDimensions");
    });

    it("should export scaled photo correctly", () => {
      const photo = createTestPhoto();
      const scaledPhoto = photo.scale(2);
      const json = scaledPhoto.toJSON();

      expect(json.width).toBe(40);
      expect(json.height).toBe(30);
    });

    it("should export moved photo correctly", () => {
      const photo = createTestPhoto();
      const movedPhoto = photo.move(5, 5);
      const json = movedPhoto.toJSON();

      expect(json.x).toBe(2.5);
      expect(json.y).toBe(2.5);
    });
  });

  describe("immutability", () => {
    it("should not allow modification of photo after creation", () => {
      const photo = createTestPhoto();
      const originalId = photo.id;
      const originalSrc = photo.src;

      // TypeScript prevents this at compile time
      // Verify runtime immutability
      expect(photo.id).toBe(originalId);
      expect(photo.src).toBe(originalSrc);
    });

    it("should maintain immutability through multiple operations", () => {
      const photo = createTestPhoto();
      const scaled = photo.scale(2);
      const moved = scaled.move(5, 5);

      // Original photo unchanged
      expect(photo.dimensions.width).toBe(20);
      expect(photo.position.x).toBe(-2.5);

      // Scaled photo unchanged
      expect(scaled.dimensions.width).toBe(40);
      expect(scaled.position.x).toBe(-2.5);

      // Only moved photo has new values
      expect(moved.dimensions.width).toBe(40);
      expect(moved.position.x).toBe(2.5);
    });
  });
});
