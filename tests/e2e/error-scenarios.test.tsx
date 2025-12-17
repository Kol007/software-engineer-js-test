import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoEditor } from "@presentation/components/PhotoEditor/PhotoEditor";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { BrowserImageLoader } from "@infrastructure/adapters/BrowserImageLoader";
import { JSONPhotoRepository } from "@infrastructure/adapters/JSONPhotoRepository";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { act } from "react";
import { DATA_TEST_ID } from "@presentation/constants/dataTestId";

describe("Error Scenarios E2E", () => {
  beforeEach(() => {
    act(() => {
      usePhotoEditorStore.setState({
        photo: null,
        isLoading: false,
        error: null,
        isCovered: false,
      });
    });

    vi.clearAllMocks();
  });

  describe("Invalid File Types", () => {
    it("should handle invalid image file type", async () => {
      const user = userEvent.setup();

      vi.spyOn(BrowserImageLoader.prototype, "load").mockRejectedValue(
        new Error("Unsupported file type")
      );

      render(<PhotoEditor />);

      // Use a valid image MIME type but the loader will fail
      const invalidFile = new File(["invalid content"], "invalid.png", {
        type: "image/png",
      });

      const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        const error = usePhotoEditorStore.getState().error;
        expect(error).not.toBeNull();
        expect(error).toContain("Unsupported file type");
      });

      // Error should be displayed
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();

      // Photo should not be loaded
      expect(usePhotoEditorStore.getState().photo).toBeNull();
    });

    it("should handle invalid JSON file for import", async () => {
      const user = userEvent.setup();

      vi.spyOn(JSONPhotoRepository.prototype, "load").mockRejectedValue(
        new Error("Invalid photo description format")
      );

      render(<PhotoEditor />);

      // Use a valid JSON MIME type but with invalid structure
      const invalidJsonFile = new File(["{}"], "invalid.json", { type: "application/json" });

      const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

      await user.upload(importInput, invalidJsonFile);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().error).toBe("Invalid photo description format");
      });

      expect(screen.getByText("Invalid photo description format")).toBeInTheDocument();
    });
  });

  describe("Corrupted Files", () => {
    it("should handle corrupted image file", async () => {
      const user = userEvent.setup();

      vi.spyOn(BrowserImageLoader.prototype, "load").mockRejectedValue(
        new Error("Failed to load image")
      );

      render(<PhotoEditor />);

      const corruptedFile = new File(["corrupted data"], "corrupted.png", {
        type: "image/png",
      });

      const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

      await user.upload(fileInput, corruptedFile);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().error).toBe("Failed to load image");
      });

      expect(screen.getByText("Failed to load image")).toBeInTheDocument();
    });

    it("should handle corrupted JSON file", async () => {
      const user = userEvent.setup();

      vi.spyOn(JSONPhotoRepository.prototype, "load").mockRejectedValue(
        new Error("Invalid JSON format: Unexpected token")
      );

      render(<PhotoEditor />);

      const corruptedJSON = new File(["{ invalid json"], "photo.json", {
        type: "application/json",
      });

      const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

      await user.upload(importInput, corruptedJSON);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().error).toContain("Invalid JSON format");
      });
    });
  });

  describe("Invalid JSON Import", () => {
    it("should handle JSON with missing fields", async () => {
      const user = userEvent.setup();

      vi.spyOn(JSONPhotoRepository.prototype, "load").mockRejectedValue(
        new Error("Invalid photo description format")
      );

      render(<PhotoEditor />);

      const invalidJSON = new File(
        [JSON.stringify({ canvas: { width: 15 } })],
        "invalid.json",
        { type: "application/json" }
      );

      const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

      await user.upload(importInput, invalidJSON);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().error).toBe(
          "Invalid photo description format"
        );
      });
    });

    it("should handle JSON with wrong data types", async () => {
      const user = userEvent.setup();

      vi.spyOn(JSONPhotoRepository.prototype, "load").mockRejectedValue(
        new Error("Invalid photo description format")
      );

      render(<PhotoEditor />);

      const invalidJSON = new File(
        [
          JSON.stringify({
            canvas: {
              width: "15",
              height: "10",
              photo: { id: 123 },
            },
          }),
        ],
        "invalid.json",
        { type: "application/json" }
      );

      const importInput = document.querySelector('input[accept="application/json"]') as HTMLInputElement;

      await user.upload(importInput, invalidJSON);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().error).toBeDefined();
      });
    });
  });

  describe("Export Without Proper Coverage", () => {
    it("should prevent export when photo doesn't cover canvas", async () => {
      const user = userEvent.setup();

      vi.spyOn(BrowserImageLoader.prototype, "load").mockResolvedValue({
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(10, 6.67),
        pixelWidth: 3000,
        pixelHeight: 2000,
      });

      render(<PhotoEditor />);

      // Upload photo
      const file = new File(["test"], "test.png", { type: "image/png" });
      const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().photo).not.toBeNull();
      });

      // Break coverage
      const zoomOutButton = screen.getByText(/zoom out/i);
      for (let i = 0; i < 10; i++) {
        await user.click(zoomOutButton);
      }

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().isCovered).toBe(false);
      });

      // Export button should be disabled
      const exportButton = screen.getByText(/export json/i);
      expect(exportButton).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large images", async () => {
      const user = userEvent.setup();

      vi.spyOn(BrowserImageLoader.prototype, "load").mockResolvedValue({
        base64: "data:image/png;base64,veryLargeData",
        dimensions: new Dimensions(100, 75),
        pixelWidth: 30000,
        pixelHeight: 22500,
      });

      render(<PhotoEditor />);

      const largeFile = new File(["large"], "large.png", { type: "image/png" });
      const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().photo).not.toBeNull();
      });

      // Should still work
      expect(usePhotoEditorStore.getState().error).toBeNull();
    });

    it("should handle very small images", async () => {
      const user = userEvent.setup();

      vi.spyOn(BrowserImageLoader.prototype, "load").mockResolvedValue({
        base64: "data:image/png;base64,tinyData",
        dimensions: new Dimensions(0.5, 0.33),
        pixelWidth: 150,
        pixelHeight: 100,
      });

      render(<PhotoEditor />);

      const tinyFile = new File(["tiny"], "tiny.png", { type: "image/png" });
      const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

      await user.upload(fileInput, tinyFile);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().photo).not.toBeNull();
      });

      // Should be scaled up to cover canvas
      expect(usePhotoEditorStore.getState().isCovered).toBe(true);
    });
  });

  describe("Error Recovery", () => {
    it("should allow retry after load error", async () => {
      const user = userEvent.setup();

      // First attempt fails
      vi.spyOn(BrowserImageLoader.prototype, "load")
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          base64: "data:image/png;base64,test",
          dimensions: new Dimensions(10, 6.67),
          pixelWidth: 3000,
          pixelHeight: 2000,
        });

      render(<PhotoEditor />);

      const file = new File(["test"], "test.png", { type: "image/png" });
      const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

      // First attempt
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().error).toBe("Network error");
      });

      // Second attempt should succeed
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().photo).not.toBeNull();
        expect(usePhotoEditorStore.getState().error).toBeNull();
      });
    });

    it("should clear error when loading new photo", async () => {
      const user = userEvent.setup();

      // Set initial error
      act(() => {
        usePhotoEditorStore.getState().setError("Previous error");
      });

      render(<PhotoEditor />);

      expect(screen.getByText("Previous error")).toBeInTheDocument();

      // Load new photo
      vi.spyOn(BrowserImageLoader.prototype, "load").mockResolvedValue({
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(10, 6.67),
        pixelWidth: 3000,
        pixelHeight: 2000,
      });

      const file = new File(["test"], "test.png", { type: "image/png" });
      const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().error).toBeNull();
      });

      expect(screen.queryByText("Previous error")).not.toBeInTheDocument();
    });
  });

  describe("Invalid Scale Operations", () => {
    it("should handle invalid scale factor", async () => {
      const user = userEvent.setup();

      vi.spyOn(BrowserImageLoader.prototype, "load").mockResolvedValue({
        base64: "data:image/png;base64,test",
        dimensions: new Dimensions(10, 6.67),
        pixelWidth: 3000,
        pixelHeight: 2000,
      });

      render(<PhotoEditor />);

      // Load photo
      const file = new File(["test"], "test.png", { type: "image/png" });
      const fileInput = screen.getByTestId(DATA_TEST_ID.imageInput) as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(usePhotoEditorStore.getState().photo).not.toBeNull();
      });

      // Manually trigger invalid scale
      act(() => {
        usePhotoEditorStore.getState().scalePhoto(0);
      });

      // Should set error
      expect(usePhotoEditorStore.getState().error).toBe("Scale factor must be positive");
    });
  });
});
