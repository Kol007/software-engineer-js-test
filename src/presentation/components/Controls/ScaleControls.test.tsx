import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScaleControls } from "./ScaleControls";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";

vi.mock("@presentation/store/photoEditorStore");

describe("ScaleControls", () => {
  const mockScalePhoto = vi.fn();

  const createMockPhoto = (width = 20, height = 15): Photo => {
    return new Photo(
      "test-id",
      "data:image/png;base64,test",
      new Dimensions(width, height),
      new Position(-2.5, -2.5),
      new Dimensions(width, height),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when no photo is loaded", () => {
    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo: null,
    } as any);

    const { container } = render(<ScaleControls />);

    expect(container.firstChild).toBeNull();
  });

  it("should render scale controls when photo is loaded", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    expect(screen.getByText(/zoom in/i)).toBeInTheDocument();
    expect(screen.getByText(/zoom out/i)).toBeInTheDocument();
  });

  it("should display current photo dimensions", () => {
    const photo = createMockPhoto(25.5, 18.75);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    expect(screen.getByText(/current size/i)).toBeInTheDocument();
    expect(screen.getByText(/25\.50" × 18\.75"/i)).toBeInTheDocument();
  });

  it("should call scalePhoto with 1.1 when zoom in is clicked", async () => {
    const user = userEvent.setup();
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    await user.click(screen.getByText(/zoom in/i));

    expect(mockScalePhoto).toHaveBeenCalledWith(1.1);
  });

  it("should call scalePhoto with 0.9 when zoom out is clicked", async () => {
    const user = userEvent.setup();
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    await user.click(screen.getByText(/zoom out/i));

    expect(mockScalePhoto).toHaveBeenCalledWith(0.9);
  });

  it("should render zoom buttons with correct labels", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    expect(screen.getByText(/🔍\+ zoom in \(110%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/🔍− zoom out \(90%\)/i)).toBeInTheDocument();
  });

  it("should format dimensions with 2 decimal places", () => {
    const photo = createMockPhoto(20.123456, 15.987654);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    expect(screen.getByText(/20\.12" × 15\.99"/i)).toBeInTheDocument();
  });

  it("should handle multiple zoom in clicks", async () => {
    const user = userEvent.setup();
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    const zoomInButton = screen.getByText(/zoom in/i);

    await user.click(zoomInButton);
    await user.click(zoomInButton);
    await user.click(zoomInButton);

    expect(mockScalePhoto).toHaveBeenCalledTimes(3);
    expect(mockScalePhoto).toHaveBeenCalledWith(1.1);
  });

  it("should handle multiple zoom out clicks", async () => {
    const user = userEvent.setup();
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    const zoomOutButton = screen.getByText(/zoom out/i);

    await user.click(zoomOutButton);
    await user.click(zoomOutButton);

    expect(mockScalePhoto).toHaveBeenCalledTimes(2);
    expect(mockScalePhoto).toHaveBeenCalledWith(0.9);
  });

  it("should be keyboard accessible", async () => {
    const user = userEvent.setup();
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    const zoomInButton = screen.getByText(/zoom in/i);
    zoomInButton.focus();

    expect(zoomInButton).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(mockScalePhoto).toHaveBeenCalledWith(1.1);
  });

  it("should display dimensions for very small photos", () => {
    const photo = createMockPhoto(0.5, 0.3);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    expect(screen.getByText(/0\.50" × 0\.30"/i)).toBeInTheDocument();
  });

  it("should display dimensions for very large photos", () => {
    const photo = createMockPhoto(100, 75);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      scalePhoto: mockScalePhoto,
      photo,
    } as any);

    render(<ScaleControls />);

    expect(screen.getByText(/100\.00" × 75\.00"/i)).toBeInTheDocument();
  });
});
