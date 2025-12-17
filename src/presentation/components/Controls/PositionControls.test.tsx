import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PositionControls } from "./PositionControls";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";

vi.mock("@presentation/store/photoEditorStore");

describe("PositionControls", () => {
  const mockMovePhoto = vi.fn();

  beforeEach(() => {
    vi.mocked(usePhotoEditorStore).mockReturnValue({
      movePhoto: mockMovePhoto,
    } as any);

    vi.clearAllMocks();
  });

  it("should render all four directional buttons", () => {
    render(<PositionControls />);

    expect(screen.getByTitle("Move down")).toBeInTheDocument();
    expect(screen.getByTitle("Move up")).toBeInTheDocument();
    expect(screen.getByTitle("Move right")).toBeInTheDocument();
    expect(screen.getByTitle("Move left")).toBeInTheDocument();
  });

  it("should render Move label and step indicator", () => {
    render(<PositionControls />);

    expect(screen.getByText("Move")).toBeInTheDocument();
    expect(screen.getByText('0.1"')).toBeInTheDocument();
  });

  it("should call movePhoto with correct values when up button is clicked", async () => {
    const user = userEvent.setup();

    render(<PositionControls />);

    await user.click(screen.getByTitle("Move down"));

    expect(mockMovePhoto).toHaveBeenCalledWith(0, -0.1);
  });

  it("should call movePhoto with correct values when down button is clicked", async () => {
    const user = userEvent.setup();

    render(<PositionControls />);

    await user.click(screen.getByTitle("Move up"));

    expect(mockMovePhoto).toHaveBeenCalledWith(0, 0.1);
  });

  it("should call movePhoto with correct values when left button is clicked", async () => {
    const user = userEvent.setup();

    render(<PositionControls />);

    await user.click(screen.getByTitle("Move right"));

    expect(mockMovePhoto).toHaveBeenCalledWith(-0.1, 0);
  });

  it("should call movePhoto with correct values when right button is clicked", async () => {
    const user = userEvent.setup();

    render(<PositionControls />);

    await user.click(screen.getByTitle("Move left"));

    expect(mockMovePhoto).toHaveBeenCalledWith(0.1, 0);
  });

  it("should handle multiple clicks on same button", async () => {
    const user = userEvent.setup();

    render(<PositionControls />);

    const upButton = screen.getByTitle("Move down");

    await user.click(upButton);
    await user.click(upButton);
    await user.click(upButton);

    expect(mockMovePhoto).toHaveBeenCalledTimes(3);
    expect(mockMovePhoto).toHaveBeenCalledWith(0, -0.1);
  });
});
