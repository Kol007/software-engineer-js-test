import { Dimensions } from "@domain/value-objects/Dimensions";

/**
 * Data returned after loading an image
 */
export interface ImageData {
  base64: string;

  dimensions: Dimensions;

  pixelWidth: number;
  pixelHeight: number;
}

/**
 * Port interface for loading images from external sources
 * Implementation will be provided by the infrastructure layer
 */
export interface IImageLoader {
  /**
   * Load an image file and extract its data
   * @param file - The image file to load
   * @returns Promise resolving to image data
   * @throws Error if file is invalid or cannot be loaded
   */
  load(file: File): Promise<ImageData>;
}
