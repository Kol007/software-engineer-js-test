import React from "react";

import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";

import { PhotoCanvas } from "@presentation/components/Canvas/PhotoCanvas";
import {
  PositionControls,
  FileUploader,
  ScaleControls,
  ExportButton,
  ImportButton,
  PrintButton,
} from "@presentation/components/Controls";
import { ErrorMessage } from "@presentation/components/common";

import styles from "./PhotoEditor.module.scss";
import canvasStyles from "@presentation/components/Canvas/PhotoCanvas.module.scss";
import clsx from "clsx";
import { DATA_TEST_ID } from "@presentation/constants/dataTestId.ts";

export const PhotoEditor: React.FC = () => {
  const { photo, error, isCovered } = usePhotoEditorStore();

  return (
    <div className={styles.photoEditor}>
      <div
        className={styles.photoEditor__sidebar}
        data-testid={DATA_TEST_ID.sidebar}
      >
        <section className={styles.controlSection}>
          <h2>Load Photo</h2>
          <FileUploader />
          <ImportButton />
        </section>

        {photo && (
          <>
            <section className={styles.controlSection}>
              <h2>Position</h2>
              <PositionControls />
            </section>

            <section className={styles.controlSection}>
              <h2>Scale</h2>
              <ScaleControls />
            </section>

            <section className={styles.controlSection}>
              <h2>Print & Export</h2>
              <div
                className={clsx(
                  styles.coverageIndicator,
                  isCovered ? styles.valid : styles.invalid,
                )}
              >
                {isCovered
                  ? "✓ Photo covers canvas"
                  : "✗ Photo must cover entire canvas"}
              </div>
              <div className={styles.controlSection__buttons}>
                <PrintButton />
                <ExportButton disabled={!isCovered} />
              </div>
            </section>
          </>
        )}
      </div>

      <div
        className={styles.photoEditor__canvas}
        data-testid={DATA_TEST_ID.canvas}
      >
        {error && <ErrorMessage message={error} />}

        {photo && (
          <div className={styles.photoEditor__helperContainer}>
            <span
              className={canvasStyles.photoCanvasHelper}
            >{`Photo: ${photo.dimensions.width.toFixed(1)} " × ${photo.dimensions.height.toFixed(1)}" at (${photo.position.x.toFixed(1)}", ${photo.position.y.toFixed(1)}")`}</span>
            {!isCovered && (
              <span className={canvasStyles.photoCanvasError}>
                Photo doesn&apos;t cover the entire canvas
              </span>
            )}
          </div>
        )}

        <PhotoCanvas />
      </div>
    </div>
  );
};
