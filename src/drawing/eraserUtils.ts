import type { DrawingStroke, NormalizedPoint } from "./drawingTypes";

function distanceBetweenPoints(
  first: Pick<NormalizedPoint, "x" | "y">,
  second: Pick<NormalizedPoint, "x" | "y">
): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function distanceToSegment(
  point: Pick<NormalizedPoint, "x" | "y">,
  start: Pick<NormalizedPoint, "x" | "y">,
  end: Pick<NormalizedPoint, "x" | "y">
): number {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) {
    return distanceBetweenPoints(point, start);
  }

  const rawT =
    ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) /
    segmentLengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const projection = {
    x: start.x + t * segmentX,
    y: start.y + t * segmentY
  };

  return distanceBetweenPoints(point, projection);
}

export function strokeIntersectsEraserPoint(
  stroke: DrawingStroke,
  point: Pick<NormalizedPoint, "x" | "y">,
  radius: number
): boolean {
  if (stroke.points.length === 0) {
    return false;
  }

  if (stroke.points.length === 1) {
    return distanceBetweenPoints(stroke.points[0], point) <= radius;
  }

  for (let index = 0; index < stroke.points.length - 1; index += 1) {
    if (
      distanceToSegment(point, stroke.points[index], stroke.points[index + 1]) <=
      radius
    ) {
      return true;
    }
  }

  return false;
}

export function findTouchedStrokeIds(
  strokes: DrawingStroke[],
  point: Pick<NormalizedPoint, "x" | "y">,
  radius: number
): string[] {
  return strokes
    .filter((stroke) => strokeIntersectsEraserPoint(stroke, point, radius))
    .map((stroke) => stroke.id);
}

