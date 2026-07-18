import { normalizedToPixelPoint, normalizedWidthToPixels } from "./coordinateUtils";
import type { DrawingStroke, GlyphDrawing } from "./drawingTypes";
import {
  getCanonicalStrokeOutline,
  getStrokePressureScale
} from "./strokeGeometry";

export function getRenderedStrokeWidth(
  stroke: DrawingStroke,
  canvasSize: number
): number {
  const pressureScale = getStrokePressureScale(stroke.points);

  return normalizedWidthToPixels(stroke.width, canvasSize) * pressureScale;
}

export function renderStroke(
  context: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  canvasSize: number
): void {
  if (stroke.points.length === 0) {
    return;
  }

  const outline = getCanonicalStrokeOutline(stroke);

  if (outline.length < 3) {
    console.warn("Skipping invalid stroke outline in preview", { stroke });
    return;
  }

  context.save();
  context.fillStyle = "#050505";
  const firstPoint = normalizedToPixelPoint(outline[0], canvasSize);
  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);

  for (const outlinePoint of outline.slice(1)) {
    const point = normalizedToPixelPoint(outlinePoint, canvasSize);
    context.lineTo(point.x, point.y);
  }

  context.closePath();
  context.fill();
  context.restore();
}

export function renderDrawing(
  context: CanvasRenderingContext2D,
  drawing: GlyphDrawing,
  canvasSize: number
): void {
  drawing.strokes.forEach((stroke) => renderStroke(context, stroke, canvasSize));
}
