export class Dimensions {
  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {
    if (width <= 0 || height <= 0) {
      throw new Error("Dimensions must be positive");
    }
  }

  get aspectRatio(): number {
    return this.width / this.height;
  }
}
