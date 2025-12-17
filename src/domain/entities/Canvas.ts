import { Photo } from "./Photo";
import { Dimensions } from "../value-objects/Dimensions";

export class Canvas {
  constructor(public readonly dimensions: Dimensions) {}

  static readonly PRINT_CANVAS = new Canvas(new Dimensions(15, 10));

  /**
   * Validates if photo covers the entire canvas
   * Photo must have dimensions >= canvas AND positioned so canvas is covered
   */
  isFullyCovered(photo: Photo): boolean {
    const canvasRight = this.dimensions.width;
    const canvasBottom = this.dimensions.height;

    const photoRight = photo.position.x + photo.dimensions.width;
    const photoBottom = photo.position.y + photo.dimensions.height;

    // Photo must start at or before canvas edges
    // and end at or after canvas edges
    return (
      photo.position.x <= 0 &&
      photo.position.y <= 0 &&
      photoRight >= canvasRight &&
      photoBottom >= canvasBottom
    );
  }
}
