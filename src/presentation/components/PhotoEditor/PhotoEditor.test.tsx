import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoEditor } from "./PhotoEditor";
import { usePhotoEditorStore } from "@presentation/store/photoEditorStore";
import { Photo } from "@domain/entities/Photo";
import { Dimensions } from "@domain/value-objects/Dimensions";
import { Position } from "@domain/value-objects/Position";
import { DATA_TEST_ID } from "@/presentation/constants/dataTestId";

vi.mock("@presentation/store/photoEditorStore");
vi.mock("@presentation/components/Canvas/PhotoCanvas", () => ({
  PhotoCanvas: () => <div data-testid="photo-canvas">Photo Canvas</div>,
}));
vi.mock("@presentation/components/Controls", () => ({
  PositionControls: () => <div>Position Controls</div>,
  FileUploader: () => <div>File Uploader</div>,
  ScaleControls: () => <div>Scale Controls</div>,
  ExportButton: () => <button>Export Button</button>,
  ImportButton: () => <button>Import Button</button>,
  PrintButton: () => <button>Print Button</button>,
}));

describe("PhotoEditor", () => {
  const createMockPhoto = (
    width = 20,
    height = 15,
    x = -2.5,
    y = -2.5,
  ): Photo => {
    return new Photo(
      "test-id",
      "data:image/png;base64,test",
      new Dimensions(width, height),
      new Position(x, y),
      new Dimensions(width, height),
    );
  };

  beforeEach(() => {
    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo: null,
      error: null,
      isCovered: false,
    } as any);

    vi.clearAllMocks();
  });

  it("should render photo editor with all sections", () => {
    render(<PhotoEditor />);

    expect(screen.getByText("Load Photo")).toBeInTheDocument();
    expect(screen.getByTestId("photo-canvas")).toBeInTheDocument();
  });

  it("should render file uploader and import button", () => {
    render(<PhotoEditor />);

    expect(screen.getByText("File Uploader")).toBeInTheDocument();
    expect(screen.getByText("Import Button")).toBeInTheDocument();
  });

  it("should not render position and scale controls when no photo", () => {
    render(<PhotoEditor />);

    expect(screen.queryByText("Position")).not.toBeInTheDocument();
    expect(screen.queryByText("Scale")).not.toBeInTheDocument();
  });

  it("should render position controls when photo is loaded", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: true,
    } as any);

    render(<PhotoEditor />);

    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Position Controls")).toBeInTheDocument();
  });

  it("should render scale controls when photo is loaded", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: true,
    } as any);

    render(<PhotoEditor />);

    expect(screen.getByText("Scale")).toBeInTheDocument();
    expect(screen.getByText("Scale Controls")).toBeInTheDocument();
  });

  it("should render print and export section when photo is loaded", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: true,
    } as any);

    render(<PhotoEditor />);

    expect(screen.getByText("Print & Export")).toBeInTheDocument();
  });

  it("should show valid coverage indicator when photo covers canvas", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: true,
    } as any);

    render(<PhotoEditor />);

    expect(screen.getByText("✓ Photo covers canvas")).toBeInTheDocument();
  });

  it("should show invalid coverage indicator when photo doesn't cover canvas", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: false,
    } as any);

    render(<PhotoEditor />);

    expect(
      screen.getByText("✗ Photo must cover entire canvas"),
    ).toBeInTheDocument();
  });

  it("should display error message when error exists", () => {
    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo: null,
      error: "Failed to load image",
      isCovered: false,
    } as any);

    render(<PhotoEditor />);

    expect(screen.getByText("Failed to load image")).toBeInTheDocument();
  });

  it("should not display error message when no error", () => {
    render(<PhotoEditor />);

    const errorMessages = screen.queryAllByText(/error/i);
    expect(errorMessages).toHaveLength(0);
  });

  it("should have sidebar and canvas sections", () => {
    render(<PhotoEditor />);

    expect(screen.getByTestId(DATA_TEST_ID.sidebar)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.canvas)).toBeInTheDocument();
  });

  it("should display photo dimensions when photo is loaded", () => {
    const photo = createMockPhoto(25.5, 18.75, -3.25, -4.5);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: true,
    } as any);

    render(<PhotoEditor />);

    // Helper text should show dimensions and position
    expect(screen.getByText(/25\.5/i)).toBeInTheDocument();
    expect(screen.getByText(/-3\.3/i)).toBeInTheDocument();
  });

  it("should show coverage error in helper when not covered", () => {
    const photo = createMockPhoto(10, 8, 0, 0);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: false,
    } as any);

    render(<PhotoEditor />);

    expect(
      screen.getByText(/doesn't cover the entire canvas/i),
    ).toBeInTheDocument();
  });

  it("should not show coverage error when covered", () => {
    const photo = createMockPhoto(20, 15, -2.5, -2.5);

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: true,
    } as any);

    render(<PhotoEditor />);

    expect(screen.queryByText(/doesn't cover/i)).not.toBeInTheDocument();
  });

  it("should render all control sections", () => {
    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: true,
    } as any);

    render(<PhotoEditor />);

    const headings = screen.getAllByRole("heading");
    const headingTexts = headings.map((h) => h.textContent);

    expect(headingTexts).toContain("Load Photo");
    expect(headingTexts).toContain("Position");
    expect(headingTexts).toContain("Scale");
    expect(headingTexts).toContain("Print & Export");
  });

  it("should update when store state changes", () => {
    const { rerender } = render(<PhotoEditor />);

    expect(screen.queryByText("Position")).not.toBeInTheDocument();

    const photo = createMockPhoto();

    vi.mocked(usePhotoEditorStore).mockReturnValue({
      photo,
      error: null,
      isCovered: true,
    } as any);

    rerender(<PhotoEditor />);

    expect(screen.getByText("Position")).toBeInTheDocument();
  });
});
