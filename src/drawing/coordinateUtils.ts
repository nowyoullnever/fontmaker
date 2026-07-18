import type { NormalizedPoint } from "./drawingTypes";

export type CanvasLikeRect = Pick<DOMRect, "left" | "top" | "width" | "height">;

export function clampNormalizedValue(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function normalizePressure(
  pressure: number,
  pointerType: string
): number {
  if (pointerType === "pen" && pressure > 0) {
    return clampNormalizedValue(pressure);
  }

  return 0.65;
}

export function clientPointToNormalizedPoint(
  clientX: number,
  clientY: number,
  rect: CanvasLikeRect,
  pressure: number,
  pointerType: string,
  timestamp = Date.now()
): NormalizedPoint {
  return {
    x: clampNormalizedValue((clientX - rect.left) / rect.width),
    y: clampNormalizedValue((clientY - rect.top) / rect.height),
    pressure: normalizePressure(pressure, pointerType),
    timestamp
  };
}

export function normalizedToPixelPoint(
  point: Pick<NormalizedPoint, "x" | "y">,
  size: number
): { x: number; y: number } {
  return {
    x: point.x * size,
    y: point.y * size
  };
}

export function normalizedWidthToPixels(width: number, size: number): number {
  return Math.max(1, width * size);
}

