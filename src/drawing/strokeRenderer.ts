import {
  normalizedToPixelPoint,
  normalizedWidthToPixels
} from "./coordinateUtils";
import type { DrawingStroke, GlyphDrawing } from "./drawingTypes";

function getAveragePressure(stroke: DrawingStroke): number {
  if (stroke.points.length === 0) {
    return 0.65;
  }

  const total = stroke.points.reduce((sum, point) => sum + point.pressure, 0);
  return total / stroke.points.length;
}

export function getRenderedStrokeWidth(
  stroke: DrawingStroke,
  canvasSize: number
): number {
  const pressure = getAveragePressure(stroke);
  const pressureScale = 0.88 + pressure * 0.24;

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

  context.save();
  context.strokeStyle = "#050505";
  context.fillStyle = "#050505";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = getRenderedStrokeWidth(stroke, canvasSize);

  if (stroke.points.length === 1) {
    const point = normalizedToPixelPoint(stroke.points[0], canvasSize);
    context.beginPath();
    context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  const firstPoint = normalizedToPixelPoint(stroke.points[0], canvasSize);
  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);

  for (let index = 1; index < stroke.points.length - 1; index += 1) {
    const current = normalizedToPixelPoint(stroke.points[index], canvasSize);
    const next = normalizedToPixelPoint(stroke.points[index + 1], canvasSize);
    const midPoint = {
      x: (current.x + next.x) / 2,
      y: (current.y + next.y) / 2
    };

    context.quadraticCurveTo(current.x, current.y, midPoint.x, midPoint.y);
  }

  const finalPoint = normalizedToPixelPoint(
    stroke.points[stroke.points.length - 1],
    canvasSize
  );
  context.lineTo(finalPoint.x, finalPoint.y);
  context.stroke();
  context.restore();
}

export function renderDrawing(
  context: CanvasRenderingContext2D,
  drawing: GlyphDrawing,
  canvasSize: number
): void {
  drawing.strokes.forEach((stroke) => renderStroke(context, stroke, canvasSize));
}

