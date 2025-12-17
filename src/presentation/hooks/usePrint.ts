import { useCallback, useEffect } from "react";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";

/**
 * Custom hook for handling print functionality
 * Validates photo coverage before triggering browser print dialog
 */
export const usePrint = () => {
  const { photo, isCovered, setError } = usePhotoEditorStore();

  const handlePrint = useCallback(() => {
    // Validate photo exists
    if (!photo) {
      setError("No photo loaded. Please load a photo first.");
      return;
    }

    // Validate photo covers canvas
    if (!isCovered) {
      setError("Photo must cover the entire canvas before printing.");
      return;
    }

    // Clear any errors
    setError(null);

    // Trigger browser print dialog
    window.print();
  }, [photo, isCovered, setError]);

  useEffect(() => {
    if (isCovered) {
      setError(null);
    }
  }, [isCovered, setError]);

  // Determine if print is available
  const canPrint = photo !== null && isCovered;

  return {
    handlePrint,
    canPrint,
  };
};
