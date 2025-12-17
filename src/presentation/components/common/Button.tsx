import React from "react";

import styles from "./Button.module.scss";
import clsx from "clsx";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  as?: "button" | "span" | "div";
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  [key: string]: unknown;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  fullWidth = false,
  children,
  className = "",
  as = "button",
  disabled = false,
  ...props
}) => {
  const classes = clsx(
    styles.button,
    styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    className,
    {
      [styles.buttonFullWidth]: fullWidth,
      [styles.buttonDisabled]: disabled,
    },
  );

  // Add ARIA role and tabIndex for non-button elements
  const accessibilityProps =
    as !== "button" ? { role: "button", tabIndex: 0 } : {};

  // Remove onClick when disabled
  if (disabled && props.onClick) {
    delete props.onClick;
  }

  // Add disabled attribute for button elements
  const disabledProps = as === "button" && disabled ? { disabled: true } : {};

  return React.createElement(
    as,
    { className: classes, ...accessibilityProps, ...disabledProps, ...props },
    children,
  );
};
