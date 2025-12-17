import { useCallback } from "react";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { LoadPhotoUseCase } from "@application/use-cases/LoadPhotoUseCase";
import { BrowserImageLoader } from "@infrastructure/adapters/BrowserImageLoader";

export const useImageLoader = () => {
  const { setPhoto, setLoading, setError } = usePhotoEditorStore();

  const loadImage = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);

      try {
        const imageLoader = new BrowserImageLoader();
        const useCase = new LoadPhotoUseCase(imageLoader);
        const photo = await useCase.execute(file);
        setPhoto(photo);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [setPhoto, setLoading, setError],
  );

  return { loadImage };
};
