import { Photo } from "@domain/entities/Photo";
import { Canvas } from "@domain/entities/Canvas";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";
import { IImageLoader } from "@application/ports";

export class LoadPhotoUseCase {
  constructor(private imageLoader: IImageLoader) {}

  async execute(file: File): Promise<Photo> {
    // Load and validate image
    const imageData = await this.imageLoader.load(file);

    // Calculate initial scale to cover canvas
    const canvas = Canvas.PRINT_CANVAS;
    const initialScale = this.calculateInitialScale(
      imageData.dimensions,
      canvas.dimensions,
    );

    // Calculate centered position
    const rawScaledWidth = imageData.dimensions.width * initialScale;
    const rawScaledHeight = imageData.dimensions.height * initialScale;

    // Ensure dimensions cover canvas even with floating point errors
    const scaledWidth = Math.max(rawScaledWidth, canvas.dimensions.width);
    const scaledHeight = Math.max(rawScaledHeight, canvas.dimensions.height);

    const x = (canvas.dimensions.width - scaledWidth) / 2;
    const y = (canvas.dimensions.height - scaledHeight) / 2;

    return new Photo(
      crypto.randomUUID(),
      imageData.base64,
      new Dimensions(scaledWidth, scaledHeight),
      new Position(x, y),
      imageData.dimensions,
    );
  }

  private calculateInitialScale(
    photoDimensions: Dimensions,
    canvasDimensions: Dimensions,
  ): number {
    // Scale to cover canvas (use max of width/height ratios)
    const scaleX = canvasDimensions.width / photoDimensions.width;
    const scaleY = canvasDimensions.height / photoDimensions.height;
    return Math.max(scaleX, scaleY);
  }
}
