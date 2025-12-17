import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSONPhotoRepository } from "./JSONPhotoRepository";
import { PhotoDescription } from "@application/ports/IPhotoRepository";

describe("JSONPhotoRepository", () => {
  let repository: JSONPhotoRepository;
  let mockCreateElement: any;
  let mockAppendChild: any;
  let mockRemoveChild: any;
  let mockCreateObjectURL: any;
  let mockRevokeObjectURL: any;

  beforeEach(() => {
    repository = new JSONPhotoRepository();

    // Mock DOM manipulation
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    mockCreateElement = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockAnchor as any);
    mockAppendChild = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(vi.fn());
    mockRemoveChild = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation(vi.fn());

    // Mock URL APIs
    mockCreateObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    mockRevokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(vi.fn());

    // Mock FileReader
    global.FileReader = vi.fn(function (this: any) {
      this.result = null;
      this.error = null;
      this.onload = null;
      this.onerror = null;
      this.readAsText = vi.fn(function (this: any) {
        setTimeout(() => {
          this.result =
            '{"canvas":{"width":15,"height":10,"photo":{"id":"test","src":"data:image/png;base64,test","width":20,"height":15,"x":-2.5,"y":-2.5}}}';
          if (this.onload) {
            this.onload({ target: this });
          }
        }, 0);
      });
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("save()", () => {
    const validDescription: PhotoDescription = {
      canvas: {
        width: 15,
        height: 10,
        photo: {
          id: "test-id",
          src: "data:image/png;base64,test",
          width: 20,
          height: 15,
          x: -2.5,
          y: -2.5,
        },
      },
    };

    it("should create a blob with JSON content", async () => {
      await repository.save(validDescription);

      // Verify createObjectURL was called (which creates blob)
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it("should create download link with correct attributes", async () => {
      await repository.save(validDescription);

      const anchor = mockCreateElement.mock.results[0].value;

      expect(anchor.href).toBe("blob:mock-url");
      expect(anchor.download).toMatch(/photo-description-\d+\.json/);
    });

    it("should use custom filename when provided", async () => {
      await repository.save(validDescription, "custom-name.json");

      const anchor = mockCreateElement.mock.results[0].value;

      expect(anchor.download).toBe("custom-name.json");
    });

    it("should trigger download by clicking link", async () => {
      await repository.save(validDescription);

      const anchor = mockCreateElement.mock.results[0].value;

      expect(anchor.click).toHaveBeenCalled();
    });

    it("should append and remove link from DOM", async () => {
      await repository.save(validDescription);

      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it("should revoke object URL after download", async () => {
      await repository.save(validDescription);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should format JSON with proper indentation", async () => {
      const blobSpy = vi.spyOn(global, "Blob");

      await repository.save(validDescription);

      const blobContent = blobSpy.mock.calls[0]?.[0]?.[0];
      const parsed = JSON.parse(blobContent as string);

      expect(parsed).toEqual(validDescription);
      // Verify it's formatted (has whitespace)
      expect(blobContent).toContain("\n");
      expect(blobContent).toContain("  ");
    });

    it("should create blob with correct MIME type", async () => {
      const blobSpy = vi.spyOn(global, "Blob");

      await repository.save(validDescription);

      const blobOptions = blobSpy.mock.calls[0][1];
      expect(blobOptions?.type).toBe("application/json");
    });

    it("should generate filename with timestamp", async () => {
      const beforeTime = Date.now();

      await repository.save(validDescription);

      const anchor = mockCreateElement.mock.results[0].value;
      const filename = anchor.download;

      expect(filename).toMatch(/photo-description-\d+\.json/);

      // Extract timestamp from filename
      const timestamp = parseInt(
        filename.match(/photo-description-(\d+)\.json/)?.[1] || "0",
      );
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should handle nested photo properties", async () => {
      const blobSpy = vi.spyOn(global, "Blob");

      await repository.save(validDescription);

      const blobContent = blobSpy.mock.calls[0]?.[0]?.[0];
      const parsed = JSON.parse(blobContent as string);

      expect(parsed.canvas.photo.id).toBe("test-id");
      expect(parsed.canvas.photo.src).toBe("data:image/png;base64,test");
      expect(parsed.canvas.photo.x).toBe(-2.5);
      expect(parsed.canvas.photo.y).toBe(-2.5);
    });
  });

  describe("load()", () => {
    it("should successfully load valid JSON file", async () => {
      const file = new File(
        [
          '{"canvas":{"width":15,"height":10,"photo":{"id":"test","src":"data:image/png;base64,test","width":20,"height":15,"x":-2.5,"y":-2.5}}}',
        ],
        "photo.json",
        {
          type: "application/json",
        },
      );

      const result = await repository.load(file);

      expect(result).toBeDefined();
      expect(result.canvas.width).toBe(15);
      expect(result.canvas.height).toBe(10);
    });

    it("should reject non-JSON file", async () => {
      const file = new File(["test"], "image.png", { type: "image/png" });

      await expect(repository.load(file)).rejects.toThrow(
        "File must be a JSON file",
      );
    });

    it("should reject file with invalid JSON", async () => {
      global.FileReader = vi.fn(function (this: any) {
        this.result = null;
        this.error = null;
        this.onload = null;
        this.onerror = null;
        this.readAsText = vi.fn(function (this: any) {
          setTimeout(() => {
            this.result = "{ invalid json";
            if (this.onload) {
              this.onload({ target: this });
            }
          }, 0);
        });
      }) as any;

      const file = new File(["{ invalid json"], "photo.json", {
        type: "application/json",
      });

      await expect(repository.load(file)).rejects.toThrow(
        "Invalid JSON format",
      );
    });

    it("should reject JSON with invalid structure", async () => {
      global.FileReader = vi.fn(function (this: any) {
        this.result = null;
        this.error = null;
        this.onload = null;
        this.onerror = null;
        this.readAsText = vi.fn(function (this: any) {
          setTimeout(() => {
            this.result = '{"invalid":"structure"}';
            if (this.onload) {
              this.onload({ target: this });
            }
          }, 0);
        });
      }) as any;

      const file = new File(['{"invalid":"structure"}'], "photo.json", {
        type: "application/json",
      });

      await expect(repository.load(file)).rejects.toThrow(
        "Invalid photo description format",
      );
    });

    it("should handle FileReader error", async () => {
      global.FileReader = vi.fn(function (this: any) {
        this.result = null;
        this.error = { message: "Read error" };
        this.onload = null;
        this.onerror = null;
        this.readAsText = vi.fn(function (this: any) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({ target: this });
            }
          }, 0);
        });
      }) as any;

      const file = new File(["test"], "photo.json", {
        type: "application/json",
      });

      await expect(repository.load(file)).rejects.toThrow(
        "Failed to read file",
      );
    });
  });

  describe("validate()", () => {
    it("should validate correct photo description", () => {
      const validDescription: PhotoDescription = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(validDescription)).toBe(true);
    });

    it("should reject null data", () => {
      expect(repository.validate(null)).toBe(false);
    });

    it("should reject undefined data", () => {
      expect(repository.validate(undefined)).toBe(false);
    });

    it("should reject non-object data", () => {
      expect(repository.validate("string")).toBe(false);
      expect(repository.validate(123)).toBe(false);
      expect(repository.validate(true)).toBe(false);
    });

    it("should reject data without canvas property", () => {
      const invalid = { photo: {} };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject canvas without width", () => {
      const invalid = {
        canvas: {
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject canvas without height", () => {
      const invalid = {
        canvas: {
          width: 15,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject canvas with non-numeric width", () => {
      const invalid = {
        canvas: {
          width: "15",
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject canvas without photo", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject photo without id", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject photo without src", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject photo without width", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject photo without height", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject photo without x coordinate", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject photo without y coordinate", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject photo with non-string id", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: 123,
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should reject photo with non-numeric dimensions", () => {
      const invalid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: "20",
            height: 15,
            x: -2.5,
            y: -2.5,
          },
        },
      };

      expect(repository.validate(invalid)).toBe(false);
    });

    it("should accept photo with zero coordinates", () => {
      const valid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: 0,
            y: 0,
          },
        },
      };

      expect(repository.validate(valid)).toBe(true);
    });

    it("should accept photo with negative coordinates", () => {
      const valid = {
        canvas: {
          width: 15,
          height: 10,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20,
            height: 15,
            x: -10,
            y: -10,
          },
        },
      };

      expect(repository.validate(valid)).toBe(true);
    });

    it("should accept photo with decimal values", () => {
      const valid = {
        canvas: {
          width: 15.5,
          height: 10.75,
          photo: {
            id: "test",
            src: "data:image/png;base64,test",
            width: 20.25,
            height: 15.5,
            x: -2.75,
            y: -2.125,
          },
        },
      };

      expect(repository.validate(valid)).toBe(true);
    });
  });
});
