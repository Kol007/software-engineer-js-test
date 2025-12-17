import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserImageLoader } from "./BrowserImageLoader";

describe("BrowserImageLoader", () => {
  let imageLoader: BrowserImageLoader;
  let mockFileReader: any;
  let mockImage: any;

  beforeEach(() => {
    // Mock FileReader
    mockFileReader = {
      result: null,
      error: null,
      onload: null,
      onerror: null,
      readAsDataURL: vi.fn(function (this: any) {
        setTimeout(() => {
          this.result = "data:image/png;base64,mockBase64Data";
          if (this.onload) {
            this.onload({ target: this });
          }
        }, 0);
      }),
    };

    global.FileReader = vi.fn(function (this: any) {
      Object.assign(this, mockFileReader);
      return this;
    }) as any;

    // Mock Image
    mockImage = {
      onload: null,
      onerror: null,
      src: "",
      naturalWidth: 3000,
      naturalHeight: 2000,
    };

    global.Image = vi.fn(function (this: any) {
      Object.assign(this, mockImage);
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
      return this;
    }) as any;

    imageLoader = new BrowserImageLoader();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("load()", () => {
    it("should successfully load a valid PNG image", async () => {
      const file = new File(["test"], "test.png", { type: "image/png" });

      const result = await imageLoader.load(file);

      expect(result.base64).toBe("data:image/png;base64,mockBase64Data");
      expect(result.pixelWidth).toBe(3000);
      expect(result.pixelHeight).toBe(2000);
      expect(result.dimensions.width).toBe(10); // 3000 / 300 DPI
      expect(result.dimensions.height).toBeCloseTo(6.67, 1); // 2000 / 300 DPI
    });

    it("should successfully load a valid JPEG image", async () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const result = await imageLoader.load(file);

      expect(result).toBeDefined();
      expect(result.base64).toBeDefined();
    });

    it("should successfully load a valid JPG image", async () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpg" });

      const result = await imageLoader.load(file);

      expect(result).toBeDefined();
    });

    it("should successfully load a valid GIF image", async () => {
      const file = new File(["test"], "test.gif", { type: "image/gif" });

      const result = await imageLoader.load(file);

      expect(result).toBeDefined();
    });

    it("should successfully load a valid WEBP image", async () => {
      const file = new File(["test"], "test.webp", { type: "image/webp" });

      const result = await imageLoader.load(file);

      expect(result).toBeDefined();
    });

    it("should reject unsupported file type", async () => {
      const file = new File(["test"], "document.pdf", {
        type: "application/pdf",
      });

      await expect(imageLoader.load(file)).rejects.toThrow(
        "Unsupported file type: application/pdf",
      );
    });

    it("should reject text file", async () => {
      const file = new File(["test"], "file.txt", { type: "text/plain" });

      await expect(imageLoader.load(file)).rejects.toThrow(
        "Unsupported file type",
      );
    });

    it("should convert dimensions from pixels to inches at 300 DPI", async () => {
      mockImage.naturalWidth = 4500;
      mockImage.naturalHeight = 3000;

      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = await imageLoader.load(file);

      expect(result.dimensions.width).toBe(15); // 4500 / 300
      expect(result.dimensions.height).toBe(10); // 3000 / 300
    });

    it("should use custom DPI when provided", async () => {
      const customLoader = new BrowserImageLoader(150);
      mockImage.naturalWidth = 1500;
      mockImage.naturalHeight = 1000;

      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = await customLoader.load(file);

      expect(result.dimensions.width).toBe(10); // 1500 / 150
      expect(result.dimensions.height).toBeCloseTo(6.67, 1); // 1000 / 150
    });

    it("should handle FileReader error", async () => {
      mockFileReader.readAsDataURL = vi.fn(function (this: any) {
        setTimeout(() => {
          this.error = { message: "File read error" };
          if (this.onerror) {
            this.onerror({ target: this });
          }
        }, 0);
      });

      const file = new File(["test"], "test.png", { type: "image/png" });

      await expect(imageLoader.load(file)).rejects.toThrow(
        "Failed to read file",
      );
    });

    it("should handle Image loading error", async () => {
      global.Image = vi.fn(function (this: any) {
        Object.assign(this, mockImage);
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 0);
        return this;
      }) as any;

      const file = new File(["test"], "test.png", { type: "image/png" });

      await expect(imageLoader.load(file)).rejects.toThrow(
        "Failed to load image",
      );
    });

    it("should handle non-string FileReader result", async () => {
      mockFileReader.readAsDataURL = vi.fn(function (this: any) {
        setTimeout(() => {
          this.result = new ArrayBuffer(8); // Not a string
          if (this.onload) {
            this.onload({ target: this });
          }
        }, 0);
      });

      const file = new File(["test"], "test.png", { type: "image/png" });

      await expect(imageLoader.load(file)).rejects.toThrow(
        "Failed to read file as data URL",
      );
    });

    it("should preserve pixel dimensions in result", async () => {
      mockImage.naturalWidth = 1920;
      mockImage.naturalHeight = 1080;

      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = await imageLoader.load(file);

      expect(result.pixelWidth).toBe(1920);
      expect(result.pixelHeight).toBe(1080);
    });

    it("should handle very small images", async () => {
      mockImage.naturalWidth = 100;
      mockImage.naturalHeight = 100;

      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = await imageLoader.load(file);

      expect(result.dimensions.width).toBeCloseTo(0.33, 1);
      expect(result.dimensions.height).toBeCloseTo(0.33, 1);
    });

    it("should handle very large images", async () => {
      mockImage.naturalWidth = 30000;
      mockImage.naturalHeight = 20000;

      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = await imageLoader.load(file);

      expect(result.dimensions.width).toBe(100);
      expect(result.dimensions.height).toBeCloseTo(66.67, 1);
    });

    it("should handle square images", async () => {
      mockImage.naturalWidth = 3000;
      mockImage.naturalHeight = 3000;

      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = await imageLoader.load(file);

      expect(result.dimensions.width).toBe(10);
      expect(result.dimensions.height).toBe(10);
    });

    it("should handle portrait images", async () => {
      mockImage.naturalWidth = 2000;
      mockImage.naturalHeight = 3000;

      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = await imageLoader.load(file);

      expect(result.dimensions.width).toBeCloseTo(6.67, 1);
      expect(result.dimensions.height).toBe(10);
    });

    it("should set image src to base64 result", async () => {
      const file = new File(["test"], "test.png", { type: "image/png" });

      await imageLoader.load(file);

      // Verify that Image.src was set
      const imageInstance = vi.mocked(global.Image).mock.results[0].value;
      expect(imageInstance.src).toBe("data:image/png;base64,mockBase64Data");
    });

    it("should call FileReader.readAsDataURL with the file", async () => {
      const file = new File(["test"], "test.png", { type: "image/png" });

      await imageLoader.load(file);

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });
  });

  describe("error messages", () => {
    it("should provide list of supported file types in error", async () => {
      const file = new File(["test"], "document.pdf", {
        type: "application/pdf",
      });

      await expect(imageLoader.load(file)).rejects.toThrow(
        /Supported types:.*image\/jpeg.*image\/png/,
      );
    });

    it("should include actual file type in error message", async () => {
      const file = new File(["test"], "document.pdf", {
        type: "application/pdf",
      });

      await expect(imageLoader.load(file)).rejects.toThrow("application/pdf");
    });
  });

  describe("edge cases", () => {
    it("should handle image with odd dimensions", async () => {
      mockImage.naturalWidth = 3001;
      mockImage.naturalHeight = 2001;

      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = await imageLoader.load(file);

      expect(result.dimensions.width).toBeCloseTo(10.003, 2);
      expect(result.dimensions.height).toBeCloseTo(6.67, 1);
    });

    it("should handle different DPI values correctly", async () => {
      const dpiValues = [72, 150, 300, 600];

      for (const dpi of dpiValues) {
        const loader = new BrowserImageLoader(dpi);
        mockImage.naturalWidth = dpi * 10; // 10 inches
        mockImage.naturalHeight = dpi * 5; // 5 inches

        const file = new File(["test"], "test.png", { type: "image/png" });
        const result = await loader.load(file);

        expect(result.dimensions.width).toBe(10);
        expect(result.dimensions.height).toBe(5);
      }
    });

    it("should reject file with empty type", async () => {
      const file = new File(["test"], "test", { type: "" });

      await expect(imageLoader.load(file)).rejects.toThrow(
        "Unsupported file type",
      );
    });
  });
});
