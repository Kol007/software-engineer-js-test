import {
  IPhotoRepository,
  PhotoDescription,
} from "@application/ports/IPhotoRepository";

/**
 * JSON-based implementation of IPhotoRepository
 * Handles loading JSON files and validating their structure
 */
export class JSONPhotoRepository implements IPhotoRepository {
  /**
   * Save a photo description as a JSON file (triggers browser download)
   * @param description - The photo description to save
   * @param filename - Optional filename (defaults to photo-description-{timestamp}.json)
   */
  async save(description: PhotoDescription, filename?: string): Promise<void> {
    const json = JSON.stringify(description, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    const defaultFilename = `photo-description-${Date.now()}.json`;
    const finalFilename = filename || defaultFilename;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = finalFilename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Load a photo description from a JSON file
   * @param file - The JSON file containing the photo description
   * @returns Promise resolving to the loaded photo description
   * @throws Error if file is invalid or cannot be parsed
   */
  async load(file: File): Promise<PhotoDescription> {
    // Validate file type
    if (!file.type.includes("json")) {
      throw new Error("File must be a JSON file");
    }

    // Read file content
    const content = await this.readFileAsText(file);

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${(error as Error).message}`);
    }

    // Validate structure
    if (!this.validate(data)) {
      throw new Error("Invalid photo description format");
    }

    return data;
  }

  /**
   * Validate that data matches PhotoDescription structure
   * @param data - The data to validate
   * @returns true if valid, false otherwise
   */
  validate(data: unknown): data is PhotoDescription {
    if (!data || typeof data !== "object") {
      return false;
    }

    const desc = data as Record<string, unknown>;

    // Check canvas object exists
    if (!desc.canvas || typeof desc.canvas !== "object") {
      return false;
    }

    const canvas = desc.canvas as Record<string, unknown>;

    // Check canvas dimensions
    if (typeof canvas.width !== "number" || typeof canvas.height !== "number") {
      return false;
    }

    // Check photo object exists
    if (!canvas.photo || typeof canvas.photo !== "object") {
      return false;
    }

    const photo = canvas.photo as Record<string, unknown>;

    // Check all required photo properties
    return (
      typeof photo.id === "string" &&
      typeof photo.src === "string" &&
      typeof photo.width === "number" &&
      typeof photo.height === "number" &&
      typeof photo.x === "number" &&
      typeof photo.y === "number"
    );
  }

  /**
   * Read file as text using FileReader
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Failed to read file as text"));
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            `Failed to read file: ${reader.error?.message || "Unknown error"}`,
          ),
        );
      };

      reader.readAsText(file);
    });
  }
}
