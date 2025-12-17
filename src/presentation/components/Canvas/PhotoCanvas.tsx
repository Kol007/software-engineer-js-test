import React, { useEffect, useRef, useState, useCallback } from "react";

import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { PhotoCropper } from "@domain/services/PhotoCropper";

import styles from "./PhotoCanvas.module.scss";

const DISPLAY_WIDTH = 750; // pixels for display
const DISPLAY_HEIGHT = 500; // pixels for display (15:10 ratio)

// Print resolution: 15" × 10" at 300 DPI
const PRINT_WIDTH = 4500; // 15 * 300
const PRINT_HEIGHT = 3000; // 10 * 300

export const PhotoCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { photo, canvas } = usePhotoEditorStore();
  const [isPrinting, setIsPrinting] = useState(false);

  // Render canvas with appropriate resolution based on print mode
  const renderCanvas = useCallback(
    (forPrint: boolean) => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;

      const ctx = canvasElement.getContext("2d");
      if (!ctx) return;

      const width = forPrint ? PRINT_WIDTH : DISPLAY_WIDTH;
      const height = forPrint ? PRINT_HEIGHT : DISPLAY_HEIGHT;

      // Set canvas dimensions
      canvasElement.width = width;
      canvasElement.height = height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (forPrint && photo) {
        // High-resolution print rendering - only render the cropped photo
        const img = new Image();
        img.onload = () => {
          // Get the cropped area (what's visible within canvas boundaries)
          const croppedArea = PhotoCropper.getCroppedArea(photo, canvas);

          // Convert cropped area from inches to source image pixels
          const sourceArea = PhotoCropper.croppedAreaToPixels(
            croppedArea,
            img.naturalWidth,
            img.naturalHeight,
            {
              width: photo.originalDimensions.width,
              height: photo.originalDimensions.height,
            },
          );

          // Draw the cropped portion of the photo to fill the entire print canvas
          ctx.drawImage(
            img,
            sourceArea.x,
            sourceArea.y,
            sourceArea.width,
            sourceArea.height,
            0,
            0,
            PRINT_WIDTH,
            PRINT_HEIGHT,
          );
        };
        img.src = photo.src;
      } else {
        // Display rendering with visual guides
        // Draw canvas border
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);

        // Draw canvas dimensions label
        ctx.fillStyle = "#888";
        ctx.font = "14px sans-serif";
        ctx.fillText(
          `Canvas: ${canvas.dimensions.width}" × ${canvas.dimensions.height}"`,
          10,
          height - 10,
        );

        // Draw photo if exists
        if (photo) {
          const img = new Image();
          img.onload = () => {
            // Convert inches to display pixels
            const scale = width / canvas.dimensions.width;

            const photoX = photo.position.x * scale;
            const photoY = photo.position.y * scale;
            const photoWidth = photo.dimensions.width * scale;
            const photoHeight = photo.dimensions.height * scale;

            // Draw photo
            ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight);

            // Draw photo border (for visualization)
            ctx.strokeStyle = "#646cff";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            const borderOffset = 1; // Gap between photo and border
            ctx.strokeRect(
              photoX - borderOffset,
              photoY - borderOffset,
              photoWidth + borderOffset * 2,
              photoHeight + borderOffset * 2,
            );
            ctx.setLineDash([]);
          };
          img.src = photo.src;
        } else {
          // Show placeholder text
          ctx.fillStyle = "#ccc";
          ctx.font = "20px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("No photo loaded", width / 2, height / 2);
          ctx.textAlign = "left";
        }
      }
    },
    [photo, canvas],
  );

  // Render canvas when photo or canvas changes
  useEffect(() => {
    renderCanvas(isPrinting);
  }, [photo, canvas, isPrinting, renderCanvas]);

  // Handle print events
  useEffect(() => {
    const handleBeforePrint = () => {
      setIsPrinting(true);
    };

    const handleAfterPrint = () => {
      setIsPrinting(false);
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return (
    <div className={styles.photoCanvas}>
      <canvas ref={canvasRef} className={styles.photoCanvas__canvas} />
    </div>
  );
};
