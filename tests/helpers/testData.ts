import { Photo } from "@domain/entities/Photo";
import { Canvas } from "@domain/entities/Canvas";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";
import { PhotoDescription } from "@application/ports/IPhotoRepository";

/**
 * Mock base64 image data (1x1 transparent PNG)
 */
export const MOCK_BASE64_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/**
 * Alternative mock base64 image
 */
export const MOCK_BASE64_IMAGE_2 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

/**
 * Creates a test Photo entity
 */
export function createTestPhoto(overrides?: {
  id?: string;
  src?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}): Photo {
  const {
    id = "test-photo-id",
    src = MOCK_BASE64_IMAGE,
    width = 20,
    height = 15,
    x = -2.5,
    y = -2.5,
  } = overrides || {};

  return new Photo(
    id,
    src,
    new Dimensions(width, height),
    new Position(x, y),
    new Dimensions(width, height) // originalDimensions same as current
  );
}

/**
 * Creates a photo that fully covers the canvas
 */
export function createCoveringPhoto(): Photo {
  return createTestPhoto({
    width: 20,
    height: 15,
    x: -2.5,
    y: -2.5,
  });
}

/**
 * Creates a photo that doesn't cover the canvas
 */
export function createNonCoveringPhoto(): Photo {
  return createTestPhoto({
    width: 10,
    height: 8,
    x: 0,
    y: 0,
  });
}

/**
 * Creates a valid PhotoDescription for testing
 */
export function createTestPhotoDescription(overrides?: {
  canvasWidth?: number;
  canvasHeight?: number;
  photo?: Partial<Photo>;
}): PhotoDescription {
  const {
    canvasWidth = 15,
    canvasHeight = 10,
    photo = {},
  } = overrides || {};

  return {
    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      photo: {
        id: photo.id || "test-photo-id",
        src: MOCK_BASE64_IMAGE,
        width: 20,
        height: 15,
        x: -2.5,
        y: -2.5,
        ...photo,
      },
    },
  };
}

/**
 * Creates invalid photo description (missing fields)
 */
export function createInvalidPhotoDescription(): Partial<PhotoDescription> {
  return {
    canvas: {
      width: 15,
      // @ts-expect-error - intentionally missing height
      photo: {
        id: "test",
        src: MOCK_BASE64_IMAGE,
        // missing dimensions
      },
    },
  };
}

/**
 * Test canvas constant
 */
export const TEST_CANVAS = Canvas.PRINT_CANVAS;

/**
 * Common test dimensions
 */
export const TEST_DIMENSIONS = {
  small: new Dimensions(5, 5),
  medium: new Dimensions(15, 10),
  large: new Dimensions(30, 20),
  portrait: new Dimensions(10, 15),
  landscape: new Dimensions(20, 10),
  square: new Dimensions(15, 15),
};

/**
 * Common test positions
 */
export const TEST_POSITIONS = {
  origin: new Position(0, 0),
  centered: new Position(-2.5, -2.5),
  topLeft: new Position(-5, -5),
  bottomRight: new Position(5, 5),
  negative: new Position(-10, -10),
};
