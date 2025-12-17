import { IImageLoader, ImageData } from "@application/ports/IImageLoader";
import { Dimensions } from "@domain/value-objects/Dimensions";

/**
 * Default DPI for converting pixels to inches
 * Standard print resolution is 300 DPI
 */
const DEFAULT_DPI = 300;

/**
 * Supported image MIME types
 */
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Browser-based implementation of IImageLoader
 * Uses FileReader API to load images from the file system
 */
export class BrowserImageLoader implements IImageLoader {
  constructor(private readonly dpi: number = DEFAULT_DPI) {}

  /**
   * Load an image file and extract its data
   * @param file - The image file to load
   * @returns Promise resolving to image data with base64 and dimensions
   * @throws Error if file is not a valid image or cannot be loaded
   */
  async load(file: File): Promise<ImageData> {
    // Validate file type
    this.validateFileType(file);

    // Read file as data URL (base64)
    const base64 = await this.readFileAsDataURL(file);

    // Load image to get dimensions
    const img = await this.loadImage(base64);

    // Convert pixel dimensions to inches
    const dimensions = new Dimensions(
      img.naturalWidth / this.dpi,
      img.naturalHeight / this.dpi,
    );

    return {
      base64,
      dimensions,
      pixelWidth: img.naturalWidth,
      pixelHeight: img.naturalHeight,
    };
  }

  /**
   * Validate that the file is a supported image type
   */
  private validateFileType(file: File): void {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        `Unsupported file type: ${file.type}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(", ")}`,
      );
    }
  }

  /**
   * Read file as data URL using FileReader
   */
  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Failed to read file as data URL"));
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            `Failed to read file: ${reader.error?.message || "Unknown error"}`,
          ),
        );
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Load image to get its natural dimensions
   */
  private loadImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = base64;
    });
  }
}
