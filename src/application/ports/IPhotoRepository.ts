/**
 * Photo description format for export/import
 * Matches the JSON structure required by the specification
 */
export interface PhotoDescription {
  canvas: {
    width: number;
    height: number;
    photo: {
      id: string;
      src: string; // base64-encoded image
      width: number; // in inches
      height: number; // in inches
      x: number; // in inches
      y: number; // in inches
    };
  };
}

/**
 * Port interface for persisting and retrieving photo descriptions
 * Implementation could use localStorage, IndexedDB, or API calls
 */
export interface IPhotoRepository {
  /**
   * Save a photo description
   * @param description - The photo description to save
   * @param filename - Optional filename for the saved data
   * @returns Promise that resolves when save is complete
   * @throws Error if save fails
   */
  save(description: PhotoDescription, filename?: string): Promise<void>;

  /**
   * Load a photo description from a file
   * @param file - The JSON file containing the photo description
   * @returns Promise resolving to the loaded photo description
   * @throws Error if file is invalid or cannot be parsed
   */
  load(file: File): Promise<PhotoDescription>;

  /**
   * Validate a photo description structure
   * @param data - The data to validate
   * @returns true if valid, false otherwise
   */
  validate(data: unknown): data is PhotoDescription;
}
