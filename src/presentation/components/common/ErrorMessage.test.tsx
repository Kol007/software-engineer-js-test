import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorMessage } from "./ErrorMessage";

describe("ErrorMessage", () => {
  it("should render error message", () => {
    render(<ErrorMessage message="Test error message" />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should render error icon", () => {
    render(<ErrorMessage message="Error" />);

    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("should not render dismiss button when onDismiss is not provided", () => {
    render(<ErrorMessage message="Error" />);

    expect(
      screen.queryByRole("button", { name: "Dismiss error" }),
    ).not.toBeInTheDocument();
  });

  it("should render dismiss button when onDismiss is provided", () => {
    const handleDismiss = vi.fn();

    render(<ErrorMessage message="Error" onDismiss={handleDismiss} />);

    expect(
      screen.getByRole("button", { name: "Dismiss error" }),
    ).toBeInTheDocument();
  });

  it("should call onDismiss when dismiss button is clicked", async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(<ErrorMessage message="Error" onDismiss={handleDismiss} />);

    await user.click(screen.getByRole("button", { name: "Dismiss error" }));

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("should have proper aria-label on dismiss button", () => {
    const handleDismiss = vi.fn();

    render(<ErrorMessage message="Error" onDismiss={handleDismiss} />);

    const dismissButton = screen.getByRole("button", { name: "Dismiss error" });
    expect(dismissButton).toHaveAttribute("aria-label", "Dismiss error");
  });

  it("should render HTML entities correctly in message", () => {
    render(<ErrorMessage message="Error: File size > 10MB" />);

    expect(screen.getByText("Error: File size > 10MB")).toBeInTheDocument();
  });
});
