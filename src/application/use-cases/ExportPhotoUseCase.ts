import { Photo } from "@domain/entities/Photo";
import { Canvas } from "@domain/entities/Canvas";
import { IPhotoRepository, PhotoDescription } from "@application/ports";

export class ExportPhotoUseCase {
  constructor(private repository: IPhotoRepository) {}

  async execute(photo: Photo): Promise<void> {
    const canvas = Canvas.PRINT_CANVAS;

    // Validate photo covers canvas
    if (!canvas.isFullyCovered(photo)) {
      throw new Error("Photo must fully cover the canvas before exporting");
    }

    const description: PhotoDescription = {
      canvas: {
        width: canvas.dimensions.width,
        height: canvas.dimensions.height,
        photo: photo.toJSON(),
      },
    };

    await this.repository.save(description);
  }
}
