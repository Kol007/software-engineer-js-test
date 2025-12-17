/**
 * Creates a mock File object for testing
 */
export function createMockFile(
  content: string | ArrayBuffer = "mock content",
  filename: string = "test.png",
  mimeType: string = "image/png"
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Creates a mock image file with specific properties
 */
export function createMockImageFile(options: {
  filename?: string;
  mimeType?: "image/png" | "image/jpeg" | "image/jpg" | "image/gif" | "image/webp";
  size?: number;
} = {}): File {
  const {
    filename = "test-image.png",
    mimeType = "image/png",
    size = 1024,
  } = options;

  const content = new ArrayBuffer(size);
  return createMockFile(content, filename, mimeType);
}

/**
 * Creates a mock JSON file for testing imports
 */
export function createMockJSONFile(
  data: unknown,
  filename: string = "photo-description.json"
): File {
  const content = JSON.stringify(data);
  return createMockFile(content, filename, "application/json");
}

/**
 * Creates an invalid file (non-image)
 */
export function createInvalidFile(
  filename: string = "document.pdf",
  mimeType: string = "application/pdf"
): File {
  return createMockFile("invalid content", filename, mimeType);
}
