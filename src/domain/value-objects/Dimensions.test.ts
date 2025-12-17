import { describe, it, expect } from "vitest";
import { Dimensions } from "./Dimensions";

describe("Dimensions", () => {
  describe("constructor", () => {
    it("should create dimensions with valid positive numbers", () => {
      const dimensions = new Dimensions(10, 20);

      expect(dimensions.width).toBe(10);
      expect(dimensions.height).toBe(20);
    });

    it("should throw error for zero width", () => {
      expect(() => new Dimensions(0, 10)).toThrow(
        "Dimensions must be positive",
      );
    });

    it("should throw error for zero height", () => {
      expect(() => new Dimensions(10, 0)).toThrow(
        "Dimensions must be positive",
      );
    });

    it("should throw error for negative width", () => {
      expect(() => new Dimensions(-5, 10)).toThrow(
        "Dimensions must be positive",
      );
    });

    it("should throw error for negative height", () => {
      expect(() => new Dimensions(10, -5)).toThrow(
        "Dimensions must be positive",
      );
    });

    it("should accept decimal values", () => {
      const dimensions = new Dimensions(10.5, 20.75);

      expect(dimensions.width).toBe(10.5);
      expect(dimensions.height).toBe(20.75);
    });
  });

  describe("aspectRatio", () => {
    it("should calculate aspect ratio correctly", () => {
      const dimensions = new Dimensions(16, 9);

      expect(dimensions.aspectRatio).toBeCloseTo(16 / 9);
    });

    it("should calculate aspect ratio for square dimensions", () => {
      const dimensions = new Dimensions(10, 10);

      expect(dimensions.aspectRatio).toBe(10 / 10);
    });

    it("should calculate aspect ratio with decimal dimensions", () => {
      const dimensions = new Dimensions(15.5, 10.2);

      expect(dimensions.aspectRatio).toBeCloseTo(15.5 / 10.2);
    });
  });
});
