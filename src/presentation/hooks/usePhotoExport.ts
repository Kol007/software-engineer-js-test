import { useState, useCallback } from "react";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { ExportPhotoUseCase } from "@application/use-cases/ExportPhotoUseCase";
import { JSONPhotoRepository } from "@infrastructure/adapters/JSONPhotoRepository";

export const usePhotoExport = () => {
  const { photo, setError } = usePhotoEditorStore();
  const [isExporting, setIsExporting] = useState(false);

  const exportPhoto = useCallback(async () => {
    if (!photo) {
      setError("No photo to export");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const repository = new JSONPhotoRepository();
      const useCase = new ExportPhotoUseCase(repository);
      await useCase.execute(photo);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsExporting(false);
    }
  }, [photo, setError]);

  return { exportPhoto, isExporting };
};
