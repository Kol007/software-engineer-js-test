import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExportPhotoUseCase } from "./ExportPhotoUseCase";
import { IPhotoRepository } from "@application/ports/IPhotoRepository";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";
import { Canvas } from "@domain/entities/Canvas";

describe("ExportPhotoUseCase", () => {
  let mockRepository: IPhotoRepository;
  let useCase: ExportPhotoUseCase;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      load: vi.fn(),
      // @ts-ignore
      validate: vi.fn(),
    };
    useCase = new ExportPhotoUseCase(mockRepository);
  });

  const createCoveringPhoto = (): Photo => {
    return new Photo(
      "test-photo-id",
      "data:image/png;base64,test",
      new Dimensions(20, 15),
      new Position(-2.5, -2.5),
      new Dimensions(10, 7.5),
    );
  };

  const createNonCoveringPhoto = (): Photo => {
    return new Photo(
      "test-photo-id",
      "data:image/png;base64,test",
      new Dimensions(10, 8),
      new Position(0, 0),
      new Dimensions(10, 8),
    );
  };

  describe("execute()", () => {
    it("should successfully export a photo that covers the canvas", async () => {
      const photo = createCoveringPhoto();

      await useCase.execute(photo);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it("should create correct PhotoDescription structure", async () => {
      const photo = createCoveringPhoto();

      await useCase.execute(photo);

      const savedDescription = vi.mocked(mockRepository.save).mock.calls[0][0];

      expect(savedDescription).toHaveProperty("canvas");
      expect(savedDescription.canvas).toHaveProperty("width", 15);
      expect(savedDescription.canvas).toHaveProperty("height", 10);
      expect(savedDescription.canvas).toHaveProperty("photo");
    });

    it("should include all photo properties in description", async () => {
      const photo = createCoveringPhoto();

      await useCase.execute(photo);

      const savedDescription = vi.mocked(mockRepository.save).mock.calls[0][0];
      const photoData = savedDescription.canvas.photo;

      expect(photoData.id).toBe("test-photo-id");
      expect(photoData.src).toBe("data:image/png;base64,test");
      expect(photoData.width).toBe(20);
      expect(photoData.height).toBe(15);
      expect(photoData.x).toBe(-2.5);
      expect(photoData.y).toBe(-2.5);
    });

    it("should throw error when photo does not cover canvas", async () => {
      const photo = createNonCoveringPhoto();

      await expect(useCase.execute(photo)).rejects.toThrow(
        "Photo must fully cover the canvas before exporting",
      );
    });

    it("should not call repository.save when photo doesn't cover canvas", async () => {
      const photo = createNonCoveringPhoto();

      try {
        await useCase.execute(photo);
      } catch {
        // Expected to throw
      }

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should validate coverage using Canvas.isFullyCovered", async () => {
      const canvas = Canvas.PRINT_CANVAS;
      const photo = createCoveringPhoto();

      expect(canvas.isFullyCovered(photo)).toBe(true);

      await useCase.execute(photo);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should export photo at exact canvas boundaries", async () => {
      const photo = new Photo(
        "edge-photo-id",
        "data:image/png;base64,edge",
        new Dimensions(15, 10),
        new Position(0, 0),
        new Dimensions(15, 10),
      );

      await useCase.execute(photo);

      const savedDescription = vi.mocked(mockRepository.save).mock.calls[0][0];

      expect(savedDescription.canvas.photo.width).toBe(15);
      expect(savedDescription.canvas.photo.height).toBe(10);
      expect(savedDescription.canvas.photo.x).toBe(0);
      expect(savedDescription.canvas.photo.y).toBe(0);
    });

    it("should propagate repository save errors", async () => {
      const photo = createCoveringPhoto();
      const error = new Error("Failed to save");
      vi.mocked(mockRepository.save).mockRejectedValue(error);

      await expect(useCase.execute(photo)).rejects.toThrow("Failed to save");
    });

    it("should handle photo with negative position", async () => {
      const photo = new Photo(
        "negative-pos-id",
        "data:image/png;base64,test",
        new Dimensions(25, 20),
        new Position(-5, -5),
        new Dimensions(12.5, 10),
      );

      await useCase.execute(photo);

      const savedDescription = vi.mocked(mockRepository.save).mock.calls[0][0];

      expect(savedDescription.canvas.photo.x).toBe(-5);
      expect(savedDescription.canvas.photo.y).toBe(-5);
    });

    it("should handle photo with decimal dimensions and position", async () => {
      const photo = new Photo(
        "decimal-id",
        "data:image/png;base64,test",
        new Dimensions(20.5, 15.75),
        new Position(-2.75, -2.875),
        new Dimensions(10.25, 7.875),
      );

      await useCase.execute(photo);

      const savedDescription = vi.mocked(mockRepository.save).mock.calls[0][0];

      expect(savedDescription.canvas.photo.width).toBe(20.5);
      expect(savedDescription.canvas.photo.height).toBe(15.75);
      expect(savedDescription.canvas.photo.x).toBe(-2.75);
      expect(savedDescription.canvas.photo.y).toBe(-2.875);
    });

    it("should export photo toJSON format correctly", async () => {
      const photo = createCoveringPhoto();
      const expectedJSON = photo.toJSON();

      await useCase.execute(photo);

      const savedDescription = vi.mocked(mockRepository.save).mock.calls[0][0];

      expect(savedDescription.canvas.photo).toEqual(expectedJSON);
    });

    it("should always use PRINT_CANVAS dimensions", async () => {
      const photo = createCoveringPhoto();

      await useCase.execute(photo);

      const savedDescription = vi.mocked(mockRepository.save).mock.calls[0][0];

      expect(savedDescription.canvas.width).toBe(
        Canvas.PRINT_CANVAS.dimensions.width,
      );
      expect(savedDescription.canvas.height).toBe(
        Canvas.PRINT_CANVAS.dimensions.height,
      );
    });
  });

  describe("edge cases", () => {
    it("should reject photo barely not covering canvas (right edge)", async () => {
      const photo = new Photo(
        "test-id",
        "data:image/png;base64,test",
        new Dimensions(14.9, 15),
        new Position(0, -2.5),
        new Dimensions(14.9, 15),
      );

      await expect(useCase.execute(photo)).rejects.toThrow(
        "Photo must fully cover the canvas before exporting",
      );
    });

    it("should reject photo barely not covering canvas (bottom edge)", async () => {
      const photo = new Photo(
        "test-id",
        "data:image/png;base64,test",
        new Dimensions(20, 9.9),
        new Position(-2.5, 0),
        new Dimensions(20, 9.9),
      );

      await expect(useCase.execute(photo)).rejects.toThrow(
        "Photo must fully cover the canvas before exporting",
      );
    });

    it("should reject photo with positive starting position", async () => {
      const photo = new Photo(
        "test-id",
        "data:image/png;base64,test",
        new Dimensions(20, 15),
        new Position(0.1, 0),
        new Dimensions(20, 15),
      );

      await expect(useCase.execute(photo)).rejects.toThrow(
        "Photo must fully cover the canvas before exporting",
      );
    });

    it("should accept photo that barely covers canvas", async () => {
      const photo = new Photo(
        "test-id",
        "data:image/png;base64,test",
        new Dimensions(15.01, 10.01),
        new Position(-0.005, -0.005),
        new Dimensions(15.01, 10.01),
      );

      await useCase.execute(photo);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
