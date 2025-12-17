import { useState, useCallback } from "react";

import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { ImportPhotoUseCase } from "@application/use-cases/ImportPhotoUseCase";
import { JSONPhotoRepository } from "@infrastructure/adapters/JSONPhotoRepository";

export const usePhotoImport = () => {
  const { setPhoto, setError } = usePhotoEditorStore();
  const [isImporting, setIsImporting] = useState(false);

  const importPhoto = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setError(null);

      try {
        const repository = new JSONPhotoRepository();
        const useCase = new ImportPhotoUseCase(repository);
        const photo = await useCase.execute(file);
        setPhoto(photo);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setIsImporting(false);
      }
    },
    [setPhoto, setError],
  );

  return { importPhoto, isImporting };
};
