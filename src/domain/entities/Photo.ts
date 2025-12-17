import { Dimensions } from "../value-objects/Dimensions";
import { Position } from "../value-objects/Position";

export class Photo {
  constructor(
    public readonly id: string,
    public readonly src: string, // base64
    public readonly dimensions: Dimensions, // in inches
    public readonly position: Position, // in inches, relative to canvas
    public readonly originalDimensions: Dimensions, // for aspect ratio
  ) {}

  /**
   * Returns a new Photo with scaled dimensions (immutable)
   */
  scale(scaleFactor: number): Photo {
    if (scaleFactor <= 0) {
      throw new Error("Scale factor must be positive");
    }

    return new Photo(
      this.id,
      this.src,
      new Dimensions(
        this.dimensions.width * scaleFactor,
        this.dimensions.height * scaleFactor,
      ),
      this.position,
      this.originalDimensions,
    );
  }

  /**
   * Returns a new Photo with updated position (immutable)
   */
  move(deltaX: number, deltaY: number): Photo {
    return new Photo(
      this.id,
      this.src,
      this.dimensions,
      new Position(this.position.x + deltaX, this.position.y + deltaY),
      this.originalDimensions,
    );
  }

  /**
   * Export format for JSON
   */
  toJSON() {
    return {
      id: this.id,
      src: this.src,
      width: this.dimensions.width,
      height: this.dimensions.height,
      x: this.position.x,
      y: this.position.y,
    };
  }
}
