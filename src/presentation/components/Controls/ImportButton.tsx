import React, { useRef } from "react";

import { usePhotoImport } from "@presentation/hooks/usePhotoImport";
import { Button } from "@presentation/components/common/Button";

export const ImportButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importPhoto, isImporting } = usePhotoImport();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await importPhoto(file);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        id="json-input"
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        style={{ display: "none" }}
        disabled={isImporting}
      />
      <label htmlFor="json-input">
        <Button as="span" fullWidth disabled={isImporting}>
          {isImporting ? "Importing..." : "📂 Import JSON"}
        </Button>
      </label>
    </div>
  );
};
