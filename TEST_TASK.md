# Photo Canvas Editor - Implementation Documentation

## Overview

This application allows users to position and scale photos on a 15" × 10" print canvas, export the configuration as JSON, and import previously saved configurations.

**Key Requirement**: Photos must always fully cover the canvas (no white space visible).

---

## Architecture Decisions

### Clean Architecture (Layered)

The project follows Clean Architecture principles with clear separation of concerns:

```
Domain Layer (Pure Business Logic)
    ↓
Application Layer (Use Cases)
    ↓
Infrastructure Layer (External Adapters)
    ↓
Presentation Layer (React UI)
```

**Benefits**:
- **Testability**: Domain logic is pure TypeScript, no React dependencies
- **Maintainability**: Clear boundaries make code easy to navigate and modify
- **Flexibility**: Can swap implementations (e.g., switch from localStorage to API)
- **Scalability**: New features don't break existing code

### Why React + TypeScript?

- **Type Safety**: Catch errors at compile time, not runtime
- **Long-term Maintainability**: Self-documenting code, safe refactoring
- **Modern Ecosystem**: Rich tooling, testing libraries, community support
- **Component Model**: Reusable, testable UI components

### State Management: Zustand

- **Lightweight**: ~1KB, minimal boilerplate vs Redux
- **Simple API**: Easy to understand and maintain
- **TypeScript-first**: Excellent type inference
- **Flexible**: Can use with or without React hooks

---

## Project Structure

```
software-engineer-js-test/
├── src/
│   ├── App.tsx                     # Root React component
│   │
│   ├── domain/                     # Pure business logic (framework-agnostic)
│   │   ├── entities/
│   │   │   ├── Canvas.ts           # Canvas entity (15"×10"), coverage validation
│   │   │   └── Photo.ts            # Photo entity, immutable operations
│   │   └── value-objects/
│   │       ├── Dimensions.ts       # Width/height with validation
│   │       └── Position.ts         # X/Y coordinates
│   │
│   ├── application/                # Use cases (business operations)
│   │   ├── use-cases/
│   │   │   ├── LoadPhotoUseCase.ts       # Load & auto-scale photo
│   │   │   └── ExportPhotoUseCase.ts     # Export to JSON
│   │   └── ports/                        # Interfaces for dependencies
│   │       ├── IImageLoader.ts
│   │       └── IPhotoExporter.ts
│   │
│   ├── infrastructure/             # External implementations
│   │   └── adapters/
│   │       ├── BrowserImageLoader.ts     # FileReader API
│   │       ├── JSONPhotoRepository.ts    # localStorage/file download
│   │       └── CoordinateConverter.ts    # Pixels ↔ inches
│   │
│   ├── presentation/               # React layer
│   │   ├── components/
│   │   │   ├── PhotoEditor/
│   │   │   │   └── PhotoEditor.tsx       # Main editor component
│   │   │   ├── Canvas/
│   │   │   │   └── PhotoCanvas.tsx       # Canvas renderer
│   │   │   └── Controls/
│   │   │       ├── FileUploader.tsx
│   │   │       ├── PositionControls.tsx
│   │   │       ├── ScaleControls.tsx
│   │   │       ├── ExportButton.tsx
│   │   │       └── ImportButton.tsx
│   │   │
│   │   ├── hooks/                        # Custom React hooks
│   │   │   ├── useImageLoader.ts
│   │   │   ├── useCanvasRenderer.ts
│   │   │   └── usePhotoExport.ts
│   │   │
│   │   └── store/                        # State management
│   │       └── photoEditorStore.ts       # Zustand store
│   │
│   ├── styles/
│   │   └── main.scss
│   │
│   └── utils/
│       └── validators.ts
│
├── tests/
│   ├── unit/                       # Domain & application layer tests
│   ├── integration/                # Component interaction tests
│   └── setup.ts                    # Test configuration
│
├── doc/                            # Original test documentation
│   ├── correct.png
│   └── not_correct.png
│
├── vite.config.ts                  # Build configuration
├── vitest.config.ts                # Test configuration
├── tsconfig.json                   # TypeScript configuration
├── eslint.config.mts               # Code quality rules
└── package.json
```

---

## Technology Stack

### Core
- **React 19.2** - UI framework
- **TypeScript 5.9** - Type safety
- **Zustand 5.0** - State management

### Build Tools
- **Vite 7.3** - Fast build tool & dev server
- **Sass 1.57** - CSS preprocessor

### Testing
- **Vitest 4.0** - Unit & integration tests (Jest-compatible, faster)
- **@testing-library/react 16.3** - Component testing
- **jsdom 27.3** - DOM simulation

### Code Quality
- **ESLint 9.39** - Code linting
- **Prettier 3.7** - Code formatting
- **TypeScript ESLint** - TypeScript-specific rules

---

## Design Patterns Used

### 1. **Entity Pattern** (Domain)
```typescript
class Photo {
  // Immutable operations return new instances
  scale(factor: number): Photo { /* ... */ }
  move(deltaX: number, deltaY: number): Photo { /* ... */ }
}
```

### 2. **Value Object Pattern** (Domain)
```typescript
class Dimensions {
  constructor(width: number, height: number) {
    // Self-validating
    if (width <= 0 || height <= 0) throw new Error();
  }
}
```

### 3. **Use Case Pattern** (Application)
```typescript
class LoadPhotoUseCase {
  constructor(private imageLoader: IImageLoader) {}
  async execute(file: File): Promise<Photo> { /* ... */ }
}
```

### 4. **Dependency Injection** (Application → Infrastructure)
```typescript
// Depend on abstractions, not implementations
interface IImageLoader {
  load(file: File): Promise<ImageData>;
}

// Infrastructure provides implementation
class BrowserImageLoader implements IImageLoader { /* ... */ }
```

### 5. **Observer Pattern** (State Management)
```typescript
// Zustand store notifies React components of state changes
const usePhotoEditorStore = create<State>((set) => ({ /* ... */ }));
```

### 6. **Custom Hooks Pattern** (React)
```typescript
const useImageLoader = () => {
  // Encapsulate complex logic
  const loadImage = async (file: File) => { /* ... */ };
  return { loadImage };
};
```


## Key Business Rules

### 1. Canvas Coverage
- Canvas is **always** 15" × 10"
- Photo **must** cover entire canvas (no white space)
- Photo can extend beyond canvas edges
- Validation before export

### 2. Coordinate System
- All measurements in **inches** for print
- Display canvas scaled to fit screen (pixels)
- Conversion: `displayPixels = inches × DPI × scaleFactor`

### 3. Photo Properties
```typescript
{
  id: string;              // Unique identifier
  src: string;             // Base64-encoded image
  width: number;           // In inches
  height: number;          // In inches
  x: number;               // X position (inches, relative to canvas top-left)
  y: number;               // Y position (inches, relative to canvas top-left)
}
```

### 4. Initial Photo Placement
- Photo scaled to **just** cover canvas
- Centered on canvas
- Maintains aspect ratio

---

## How to Run

```bash
# Install dependencies
yarn install

# Start development server (http://localhost:8090)
yarn dev

# Run tests
yarn test

# Run tests with UI
yarn test:ui

# Run tests with coverage
yarn test:coverage

# Type checking
yarn type-check

# Lint code
yarn lint

# Format code
yarn format

# Build for production
yarn build

# Preview production build
yarn preview
```

---

## Testing Strategy

### Unit Tests (Domain & Application)
```typescript
// Test pure business logic without React
describe('Canvas.isFullyCovered', () => {
  it('should return true when photo covers canvas', () => {
    const canvas = new Canvas(new Dimensions(15, 10));
    const photo = new Photo(/*...*/);
    expect(canvas.isFullyCovered(photo)).toBe(true);
  });
});
```

### Component Tests
```typescript
// Test React components in isolation
import { render, screen } from '@testing-library/react';

test('ExportButton is disabled when photo does not cover canvas', () => {
  render(<ExportButton disabled={true} />);
  expect(screen.getByRole('button')).toBeDisabled();
});
```

### Integration Tests
```typescript
// Test complete workflows
test('User can upload, position, and export photo', async () => {
  render(<App />);
  // 1. Upload image
  // 2. Adjust position
  // 3. Export JSON
  // 4. Verify JSON structure
});
```

---

## Path Aliases

The project uses TypeScript path aliases for clean imports:

```typescript
import { Photo } from '@domain/entities/Photo';
import { LoadPhotoUseCase } from '@application/use-cases/LoadPhotoUseCase';
import { BrowserImageLoader } from '@infrastructure/adapters/BrowserImageLoader';
import { PhotoEditor } from '@presentation/components/PhotoEditor/PhotoEditor';
```

Configured in `tsconfig.json` and `vite.config.ts`.

---

## Future Considerations

### Potential Enhancements
- **Drag & Drop**: Drag photo with mouse instead of buttons
- **Zoom with Mouse Wheel**: More intuitive scaling
- **Multiple Canvases**: Support different print sizes

### Technical Improvements
- **Storybook**: Component documentation & visual testing
- **E2E Tests**: Playwright/Cypress for full user flows
- **CI/CD**: GitHub Actions for automated testing
- **Performance Monitoring**: Track canvas rendering performance

---

## Design Decisions & Trade-offs

### Why Clean Architecture?
**Pro**: Clear boundaries, testable, scalable  
**Con**: More initial boilerplate  
**Decision**: Worth it for long-term maintenance

### Why Zustand over Redux?
**Pro**: Simpler API, less boilerplate, smaller bundle  
**Con**: Less middleware ecosystem  
**Decision**: Sufficient for this app's complexity

### Why Vite over Webpack?
**Pro**: Faster dev server, simpler config, modern defaults  
**Con**: Newer tool, smaller community  
**Decision**: Better developer experience

### Why not use a Canvas Library (Fabric.js, Konva)?
**Pro**: Would make drag/drop easier  
**Con**: Heavy dependency, hides implementation details  
**Decision**: Native HTML5 Canvas for initial implementation, with potential library adoption as feature requirements expand. 

---

## Notes for Code Review

### What to Highlight
1. **Separation of Concerns**: Domain logic is pure TypeScript
2. **Immutability**: Photo operations return new instances
3. **Type Safety**: Leveraging TypeScript throughout
4. **Testability**: Easy to test without React
5. **Dependency Injection**: Interfaces, not implementations
6. **Error Handling**: Validation in value objects


