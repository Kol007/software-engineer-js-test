import { Photo } from "@domain/entities/Photo";
import { Canvas } from "@domain/entities/Canvas";

/**
 * Service for calculating photo cropping within canvas boundaries
 */
export class PhotoCropper {
  /**
   * Calculate which part of the photo is visible within canvas boundaries
   * This handles cases where the photo extends beyond canvas edges
   *
   * @param photo - The photo to crop
   * @param canvas - The canvas boundaries
   * @returns Cropped area coordinates in inches
   */
  static getCroppedArea(photo: Photo, canvas: Canvas) {
    // If photo position is negative, we need to crop from that offset
    const startX = Math.max(0, -photo.position.x);
    const startY = Math.max(0, -photo.position.y);

    // Calculate how much of the photo is visible within canvas
    const endX = Math.min(
      photo.dimensions.width,
      canvas.dimensions.width - photo.position.x,
    );
    const endY = Math.min(
      photo.dimensions.height,
      canvas.dimensions.height - photo.position.y,
    );

    const width = endX - startX;
    const height = endY - startY;

    return {
      startX,
      startY,
      width,
      height,
    };
  }

  /**
   * Convert cropped area from inches to pixel coordinates for the source image
   * @param croppedArea - Area in inches
   * @param sourcePixelWidth - Original image width in pixels
   * @param sourcePixelHeight - Original image height in pixels
   * @param photoDimensionsInches - Photo dimensions in inches
   */
  static croppedAreaToPixels(
    croppedArea: {
      startX: number;
      startY: number;
      width: number;
      height: number;
    },
    sourcePixelWidth: number,
    sourcePixelHeight: number,
    photoDimensionsInches: { width: number; height: number },
  ) {
    const scaleX = sourcePixelWidth / photoDimensionsInches.width;
    const scaleY = sourcePixelHeight / photoDimensionsInches.height;

    return {
      x: croppedArea.startX * scaleX,
      y: croppedArea.startY * scaleY,
      width: croppedArea.width * scaleX,
      height: croppedArea.height * scaleY,
    };
  }
}
