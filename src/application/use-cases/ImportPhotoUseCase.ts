import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";
import { IPhotoRepository } from "@application/ports";

/**
 * Use case for importing a photo from a saved JSON description
 */
export class ImportPhotoUseCase {
  constructor(private repository: IPhotoRepository) {}

  /**
   * Import a photo from a JSON file
   * @param file - JSON file containing photo description
   * @returns Promise resolving to reconstructed Photo entity
   * @throws Error if file is invalid or photo data is incomplete
   */
  async execute(file: File): Promise<Photo> {
    // Load and validate photo description
    const description = await this.repository.load(file);

    const photoData = description.canvas.photo;

    // Reconstruct Photo entity from JSON data
    const photo = new Photo(
      photoData.id,
      photoData.src,
      new Dimensions(photoData.width, photoData.height),
      new Position(photoData.x, photoData.y),
      // Original dimensions are the same as current dimensions in saved state
      new Dimensions(photoData.width, photoData.height),
    );

    return photo;
  }
}
