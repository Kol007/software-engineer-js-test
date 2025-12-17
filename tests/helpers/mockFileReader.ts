import { vi } from "vitest";

export interface MockFileReaderOptions {
  result?: string;
  error?: string;
  delay?: number;
}

/**
 * Creates a mock FileReader for testing
 */
export function createMockFileReader(options: MockFileReaderOptions = {}) {
  const { result = "data:image/png;base64,mock-base64-data", error, delay = 0 } = options;

  const mockFileReader = {
    result: null as string | null,
    error: null as Error | null,
    onload: null as ((event: any) => void) | null,
    onerror: null as ((event: any) => void) | null,
    readAsDataURL: vi.fn(function (this: any) {
      setTimeout(() => {
        if (error) {
          this.error = new Error(error);
          if (this.onerror) {
            this.onerror({ target: this });
          }
        } else {
          this.result = result;
          if (this.onload) {
            this.onload({ target: this });
          }
        }
      }, delay);
    }),
    readAsText: vi.fn(function (this: any) {
      setTimeout(() => {
        if (error) {
          this.error = new Error(error);
          if (this.onerror) {
            this.onerror({ target: this });
          }
        } else {
          this.result = result;
          if (this.onload) {
            this.onload({ target: this });
          }
        }
      }, delay);
    }),
  };

  return mockFileReader;
}

/**
 * Mocks the global FileReader constructor
 */
export function mockFileReaderGlobal(options: MockFileReaderOptions = {}) {
  const FileReaderMock = vi.fn(() => createMockFileReader(options));
  global.FileReader = FileReaderMock as any;
  return FileReaderMock;
}
