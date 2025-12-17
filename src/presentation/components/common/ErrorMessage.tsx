import React from "react";

import styles from "./ErrorMessage.module.scss";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
}) => {
  return (
    <div className={styles.errorMessage}>
      <span className={styles.errorMessage__icon}>⚠️</span>
      <span className={styles.errorMessage__text}>{message}</span>
      {onDismiss && (
        <button
          className={styles.errorMessage__dismiss}
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};
