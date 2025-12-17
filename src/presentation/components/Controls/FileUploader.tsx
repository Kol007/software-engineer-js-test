import React, { useRef } from "react";

import { useImageLoader } from "@presentation/hooks/useImageLoader";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Button } from "@presentation/components/common/Button";

import styles from "./FileUploader.module.scss";
import { DATA_TEST_ID } from "@presentation/constants/dataTestId.ts";

export const FileUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadImage } = useImageLoader();
  const { isLoading } = usePhotoEditorStore();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await loadImage(file);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={styles.fileUploader}>
      <input
        ref={fileInputRef}
        id="image-input"
        data-testid={DATA_TEST_ID.imageInput}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className={styles.fileUploader__input}
        disabled={isLoading}
      />
      <label htmlFor="image-input">
        <Button
          as="span"
          variant="primary"
          fullWidth
          aria-disabled={isLoading}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "📁 Select Photo"}
        </Button>
      </label>
    </div>
  );
};
