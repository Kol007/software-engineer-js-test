import React from "react";

import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Button } from "@presentation/components/common/Button";

import styles from "./ScaleControls.module.scss";

export const ScaleControls: React.FC = () => {
  const { scalePhoto, photo } = usePhotoEditorStore();

  const handleZoomIn = () => {
    scalePhoto(1.1); // 10% larger
  };

  const handleZoomOut = () => {
    scalePhoto(0.9); // 10% smaller
  };

  if (!photo) return null;

  const currentWidth = photo.dimensions.width.toFixed(2);
  const currentHeight = photo.dimensions.height.toFixed(2);

  return (
    <div className={styles.scaleControls}>
      <div className={styles.scaleControls__info}>
        <div className={styles.scaleControls__dimensions}>
          <span className={styles.scaleControls__label}>Current size:</span>
          <span className={styles.scaleControls__value}>
            {currentWidth}&quot; × {currentHeight}&quot;
          </span>
        </div>
      </div>

      <div className={styles.scaleControls__buttons}>
        <Button onClick={handleZoomOut} fullWidth>
          🔍− Zoom Out (90%)
        </Button>
        <Button onClick={handleZoomIn} fullWidth>
          🔍+ Zoom In (110%)
        </Button>
      </div>
    </div>
  );
};
