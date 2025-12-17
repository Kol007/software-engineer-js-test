import { create } from "zustand";
import { Photo } from "@domain/entities/Photo";
import { Canvas } from "@domain/entities/Canvas";

interface PhotoEditorState {
  photo: Photo | null;
  canvas: Canvas;
  isLoading: boolean;
  error: string | null;
  isCovered: boolean;

  // Actions
  setPhoto: (photo: Photo) => void;
  movePhoto: (deltaX: number, deltaY: number) => void;
  scalePhoto: (scaleFactor: number) => void;
  clearPhoto: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePhotoEditorStore = create<PhotoEditorState>((set, get) => ({
  photo: null,
  canvas: Canvas.PRINT_CANVAS,
  isLoading: false,
  error: null,
  isCovered: false,

  setPhoto: (photo) => {
    const { canvas } = get();
    set({
      photo,
      error: null,
      isCovered: canvas.isFullyCovered(photo),
    });
  },

  movePhoto: (deltaX, deltaY) => {
    const { photo, canvas } = get();
    if (photo) {
      const newPhoto = photo.move(deltaX, deltaY);
      set({
        photo: newPhoto,
        isCovered: canvas.isFullyCovered(newPhoto),
      });
    }
  },

  scalePhoto: (scaleFactor) => {
    const { photo, canvas } = get();
    if (photo) {
      try {
        const newPhoto = photo.scale(scaleFactor);
        set({
          photo: newPhoto,
          isCovered: canvas.isFullyCovered(newPhoto),
        });
      } catch (error) {
        set({ error: (error as Error).message });
      }
    }
  },

  clearPhoto: () => set({ photo: null, error: null, isCovered: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
