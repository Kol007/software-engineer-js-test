import React from "react";

import { usePrint } from "@presentation/hooks/usePrint";
import { Button } from "@presentation/components/common/Button";

/**
 * Print button component
 * Triggers browser print dialog for 15" × 10" canvas output at 300 DPI
 */
export const PrintButton: React.FC = () => {
  const { handlePrint, canPrint } = usePrint();

  return (
    <Button
      variant="primary"
      fullWidth
      onClick={handlePrint}
      disabled={!canPrint}
      title={
        canPrint
          ? "Print photo at 15&quot; × 10&quot; (300 DPI)"
          : "Photo must cover canvas to print"
      }
    >
      🖨️ Print (15&quot; × 10&quot;)
    </Button>
  );
};
