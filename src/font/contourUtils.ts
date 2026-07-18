import type { FontContour, FontPoint } from "./fontTypes";

export function signedContourArea(contour: FontContour): number {
  let area = 0;

  for (let index = 0; index < contour.length; index += 1) {
    const current = contour[index];
    const next = contour[(index + 1) % contour.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

export function removeDuplicatePoints(
  points: FontContour,
  tolerance = 0.5
): FontContour {
  const result: FontContour = [];

  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }

    const previous = result[result.length - 1];
    if (
      previous &&
      Math.hypot(point.x - previous.x, point.y - previous.y) <= tolerance
    ) {
      continue;
    }

    result.push(point);
  }

  if (
    result.length > 1 &&
    Math.hypot(
      result[0].x - result[result.length - 1].x,
      result[0].y - result[result.length - 1].y
    ) <= tolerance
  ) {
    result.pop();
  }

  return result;
}

function distanceToLine(point: FontPoint, start: FontPoint, end: FontPoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / length;
}

export function simplifyContour(
  contour: FontContour,
  tolerance = 1.25
): FontContour {
  const deduped = removeDuplicatePoints(contour);

  if (deduped.length <= 3) {
    return deduped;
  }

  const simplified = deduped.filter((point, index) => {
    const previous = deduped[(index - 1 + deduped.length) % deduped.length];
    const next = deduped[(index + 1) % deduped.length];
    return distanceToLine(point, previous, next) > tolerance;
  });

  return simplified.length >= 3 ? simplified : deduped;
}

export function normalizeContourWinding(
  contour: FontContour,
  clockwise = true
): FontContour {
  const area = signedContourArea(contour);
  const isClockwise = area < 0;

  return isClockwise === clockwise ? contour : [...contour].reverse();
}

export function finalizeContour(contour: FontContour): FontContour | null {
  const simplified = simplifyContour(contour)
    .map((point) => ({
      x: Math.round(point.x),
      y: Math.round(point.y),
      onCurve: true as const
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const deduped = removeDuplicatePoints(simplified, 0);

  if (deduped.length < 3) {
    return null;
  }

  return normalizeContourWinding(deduped, true);
}

export function rectangleContour(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  clockwise = true
): FontContour {
  const contour = [
    { x: minX, y: minY, onCurve: true as const },
    { x: maxX, y: minY, onCurve: true as const },
    { x: maxX, y: maxY, onCurve: true as const },
    { x: minX, y: maxY, onCurve: true as const }
  ];

  return normalizeContourWinding(contour, clockwise);
}
