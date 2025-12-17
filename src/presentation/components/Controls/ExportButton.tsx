import React from "react";

import { usePhotoExport } from "@presentation/hooks/usePhotoExport";

import { Button } from "../common/Button";

interface ExportButtonProps {
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ disabled }) => {
  const { exportPhoto, isExporting } = usePhotoExport();

  return (
    <Button
      variant="primary"
      fullWidth
      onClick={exportPhoto}
      disabled={disabled || isExporting}
    >
      {isExporting ? "Exporting..." : "💾 Export JSON"}
    </Button>
  );
};
