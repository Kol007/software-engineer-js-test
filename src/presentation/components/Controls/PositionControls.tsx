import React from "react";

import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Button } from "@presentation/components/common/Button";

import styles from "./PositionControls.module.scss";

const MOVE_STEP = 0.1; // inches

export const PositionControls: React.FC = () => {
  const { movePhoto } = usePhotoEditorStore();

  return (
    <div className={styles.positionControls}>
      <div className={styles.positionControls__grid}>
        <div className={styles.positionControls__row}>
          <div className={styles.positionControls__spacer}></div>
          <Button onClick={() => movePhoto(0, -MOVE_STEP)} title="Move down">
            ↑
          </Button>
          <div className={styles.positionControls__spacer}></div>
        </div>
        <div className={styles.positionControls__row}>
          <Button onClick={() => movePhoto(-MOVE_STEP, 0)} title="Move right">
            ←
          </Button>
          <div className={styles.positionControls__center}>
            <span className={styles.positionControls__label}>Move</span>
            <span className={styles.positionControls__step}>
              {MOVE_STEP}&quot;
            </span>
          </div>
          <Button onClick={() => movePhoto(MOVE_STEP, 0)} title="Move left">
            →
          </Button>
        </div>
        <div className={styles.positionControls__row}>
          <div className={styles.positionControls__spacer}></div>
          <Button onClick={() => movePhoto(0, MOVE_STEP)} title="Move up">
            ↓
          </Button>
          <div className={styles.positionControls__spacer}></div>
        </div>
      </div>
    </div>
  );
};
