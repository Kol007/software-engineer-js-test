import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImportPhotoUseCase } from "./ImportPhotoUseCase";
import {
  IPhotoRepository,
  PhotoDescription,
} from "@application/ports/IPhotoRepository";

describe("ImportPhotoUseCase", () => {
  let mockRepository: IPhotoRepository;
  let useCase: ImportPhotoUseCase;
  let mockFile: File;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      load: vi.fn(),
      // @ts-ignore
      validate: vi.fn(),
    };
    useCase = new ImportPhotoUseCase(mockRepository);
    mockFile = new File(["{}"], "photo.json", { type: "application/json" });
  });

  const createValidPhotoDescription = (): PhotoDescription => {
    return {
      canvas: {
        width: 15,
        height: 10,
        photo: {
          id: "test-photo-id",
          src: "data:image/png;base64,test",
          width: 20,
          height: 15,
          x: -2.5,
          y: -2.5,
        },
      },
    };
  };

  describe("execute()", () => {
    it("should successfully import photo from valid JSON", async () => {
      const description = createValidPhotoDescription();
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(mockRepository.load).toHaveBeenCalledWith(mockFile);
      expect(photo).toBeDefined();
    });

    it("should reconstruct Photo entity with correct properties", async () => {
      const description = createValidPhotoDescription();
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.id).toBe("test-photo-id");
      expect(photo.src).toBe("data:image/png;base64,test");
      expect(photo.dimensions.width).toBe(20);
      expect(photo.dimensions.height).toBe(15);
      expect(photo.position.x).toBe(-2.5);
      expect(photo.position.y).toBe(-2.5);
    });

    it("should set originalDimensions same as current dimensions", async () => {
      const description = createValidPhotoDescription();
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.originalDimensions.width).toBe(photo.dimensions.width);
      expect(photo.originalDimensions.height).toBe(photo.dimensions.height);
    });

    it("should preserve dimension precision", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test-id",
            src: "data:image/png;base64,test",
            width: 20.5,
            height: 15.75,
            x: -2.25,
            y: -2.875,
          },
        },
      };
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.dimensions.width).toBe(20.5);
      expect(photo.dimensions.height).toBe(15.75);
      expect(photo.position.x).toBe(-2.25);
      expect(photo.position.y).toBe(-2.875);
    });

    it("should handle photo at origin position", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "origin-photo",
            src: "data:image/png;base64,test",
            width: 15,
            height: 10,
            x: 0,
            y: 0,
          },
        },
      };
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.position.x).toBe(0);
      expect(photo.position.y).toBe(0);
    });

    it("should handle photo with negative position", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "negative-photo",
            src: "data:image/png;base64,test",
            width: 30,
            height: 20,
            x: -7.5,
            y: -5,
          },
        },
      };
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.position.x).toBe(-7.5);
      expect(photo.position.y).toBe(-5);
    });

    it("should handle different canvas dimensions in description", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 20,
          height: 15,
          photo: {
            id: "custom-canvas",
            src: "data:image/png;base64,test",
            width: 25,
            height: 20,
            x: -2.5,
            y: -2.5,
          },
        },
      };
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      // Should still import photo data correctly
      expect(photo.dimensions.width).toBe(25);
      expect(photo.dimensions.height).toBe(20);
    });

    it("should propagate repository load errors", async () => {
      const error = new Error("Failed to load file");
      vi.mocked(mockRepository.load).mockRejectedValue(error);

      await expect(useCase.execute(mockFile)).rejects.toThrow(
        "Failed to load file",
      );
    });

    it("should handle very small dimensions", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "small-photo",
            src: "data:image/png;base64,test",
            width: 0.1,
            height: 0.1,
            x: 0,
            y: 0,
          },
        },
      };
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.dimensions.width).toBe(0.1);
      expect(photo.dimensions.height).toBe(0.1);
    });

    it("should handle very large dimensions", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "large-photo",
            src: "data:image/png;base64,test",
            width: 1000,
            height: 800,
            x: -492.5,
            y: -395,
          },
        },
      };
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.dimensions.width).toBe(1000);
      expect(photo.dimensions.height).toBe(800);
    });

    it("should preserve base64 image data", async () => {
      const longBase64 = "data:image/png;base64," + "A".repeat(1000);
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "long-base64",
            src: longBase64,
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.src).toBe(longBase64);
    });

    it("should handle photo ID with special characters", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "photo-123_test@special!",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      const photo = await useCase.execute(mockFile);

      expect(photo.id).toBe("photo-123_test@special!");
    });
  });

  describe("integration with repository", () => {
    it("should call repository.load exactly once", async () => {
      const description = createValidPhotoDescription();
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      await useCase.execute(mockFile);

      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.load).toHaveBeenCalledWith(mockFile);
    });

    it("should not call repository.save or validate", async () => {
      const description = createValidPhotoDescription();
      vi.mocked(mockRepository.load).mockResolvedValue(description);

      await useCase.execute(mockFile);

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockRepository.validate).not.toHaveBeenCalled();
    });
  });

  describe("error scenarios", () => {
    it("should handle missing photo data gracefully by throwing", async () => {
      const invalidDescription = {
        canvas: {
          width: 15,
          height: 10,
          // Missing photo property
        },
      } as any;

      vi.mocked(mockRepository.load).mockResolvedValue(invalidDescription);

      await expect(useCase.execute(mockFile)).rejects.toThrow();
    });

    it("should handle invalid dimensions by throwing", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: -10, // Invalid negative width
            height: 15,
            x: 0,
            y: 0,
          },
        },
      };

      vi.mocked(mockRepository.load).mockResolvedValue(description);

      await expect(useCase.execute(mockFile)).rejects.toThrow(
        "Dimensions must be positive",
      );
    });

    it("should handle zero dimensions by throwing", async () => {
      const description: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 0,
            height: 10,
            x: 0,
            y: 0,
          },
        },
      };

      vi.mocked(mockRepository.load).mockResolvedValue(description);

      await expect(useCase.execute(mockFile)).rejects.toThrow(
        "Dimensions must be positive",
      );
    });
  });
});
