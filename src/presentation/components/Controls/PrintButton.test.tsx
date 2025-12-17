import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrintButton } from "./PrintButton";
import { usePrint } from "@presentation/hooks/usePrint";

vi.mock("@presentation/hooks/usePrint");

describe("PrintButton", () => {
  const mockHandlePrint = vi.fn();

  beforeEach(() => {
    vi.mocked(usePrint).mockReturnValue({
      handlePrint: mockHandlePrint,
      canPrint: true,
    });

    vi.clearAllMocks();
  });

  it("should render print button", () => {
    render(<PrintButton />);

    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument();
  });

  it("should call handlePrint when clicked", async () => {
    const user = userEvent.setup();

    render(<PrintButton />);

    await user.click(screen.getByRole("button"));

    expect(mockHandlePrint).toHaveBeenCalledTimes(1);
  });

  it("should not call handlePrint when disabled", async () => {
    const user = userEvent.setup();

    vi.mocked(usePrint).mockReturnValue({
      handlePrint: mockHandlePrint,
      canPrint: false,
    });

    render(<PrintButton />);

    await user.click(screen.getByRole("button"));

    expect(mockHandlePrint).not.toHaveBeenCalled();
  });

  it("should have title attribute when enabled", () => {
    vi.mocked(usePrint).mockReturnValue({
      handlePrint: mockHandlePrint,
      canPrint: true,
    });

    render(<PrintButton />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "title",
      expect.stringContaining("Print photo"),
    );
  });

  it("should have different title when disabled", () => {
    vi.mocked(usePrint).mockReturnValue({
      handlePrint: mockHandlePrint,
      canPrint: false,
    });

    render(<PrintButton />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Photo must cover canvas to print");
  });
});
