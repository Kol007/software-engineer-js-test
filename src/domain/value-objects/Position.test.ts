import { describe, it, expect } from "vitest";
import { Position } from "./Position";

describe("Position", () => {
  describe("constructor", () => {
    it("should create position with positive coordinates", () => {
      const position = new Position(10, 20);

      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
    });

    it("should create position with negative coordinates", () => {
      const position = new Position(-5, -10);

      expect(position.x).toBe(-5);
      expect(position.y).toBe(-10);
    });

    it("should create position at origin", () => {
      const position = new Position(0, 0);

      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });

    it("should accept decimal values", () => {
      const position = new Position(10.5, -20.75);

      expect(position.x).toBe(10.5);
      expect(position.y).toBe(-20.75);
    });
  });

  describe("edge cases", () => {
    it("should handle very large coordinates", () => {
      const position = new Position(1000000, 2000000);

      expect(position.x).toBe(1000000);
      expect(position.y).toBe(2000000);
    });

    it("should handle very small decimal coordinates", () => {
      const position = new Position(0.0001, 0.0002);

      expect(position.x).toBe(0.0001);
      expect(position.y).toBe(0.0002);
    });
  });
});
