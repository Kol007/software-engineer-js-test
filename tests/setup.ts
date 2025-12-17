import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock browser APIs
global.URL.createObjectURL = vi.fn(() => "mock-object-url");
global.URL.revokeObjectURL = vi.fn();

// Mock window.print
global.print = vi.fn();

// Mock Image constructor for canvas operations
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = "";
  naturalWidth = 0;
  naturalHeight = 0;

  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

global.Image = MockImage as any;

// Mock crypto.randomUUID
if (!global.crypto) {
  global.crypto = {} as any;
}
global.crypto.randomUUID = vi.fn(() => "mock-uuid-123");
