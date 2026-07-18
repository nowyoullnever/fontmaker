import { getStroke } from "perfect-freehand";
import type { DrawingStroke, NormalizedPoint } from "./drawingTypes";

export const CANONICAL_DRAWING_SIZE = 1000;
export const DOT_OUTLINE_SEGMENTS = 32;
export const STROKE_OUTLINE_ERROR =
  "?쇰? ?띿쓽 ?ㅺ낸?좎쓣 ?щ컮瑜닿쾶 留뚮뱾吏 紐삵뻽?듬땲??";

export const FREEHAND_STROKE_OPTIONS = {
  thinning: 0,
  smoothing: 0.7,
  streamline: 0.35
} as const;

export type NormalizedOutlinePoint = {
  x: number;
  y: number;
};

const GEOMETRY_EPSILON = 1e-10;
const ENDPOINT_INTERSECTION_TOLERANCE = 0.005;

export function getAverageStrokePressure(points: NormalizedPoint[]): number {
  if (points.length === 0) {
    return 0.65;
  }

  return points.reduce((sum, point) => sum + point.pressure, 0) / points.length;
}

export function getStrokePressureScale(points: NormalizedPoint[]): number {
  return 0.88 + getAverageStrokePressure(points) * 0.24;
}

export function getCanonicalStrokeSize(stroke: DrawingStroke): number {
  const points = getValidStrokePoints(stroke);
  return stroke.width * CANONICAL_DRAWING_SIZE * getStrokePressureScale(points);
}

export function getValidStrokePoints(stroke: DrawingStroke): NormalizedPoint[] {
  const result: NormalizedPoint[] = [];

  for (const point of stroke.points) {
    if (
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(point.pressure) ||
      point.x < 0 ||
      point.x > 1 ||
      point.y < 0 ||
      point.y > 1
    ) {
      continue;
    }

    const previous = result[result.length - 1];
    if (
      previous &&
      previous.x === point.x &&
      previous.y === point.y &&
      previous.pressure === point.pressure
    ) {
      continue;
    }

    result.push({ ...point });
  }

  return result;
}

function buildDotOutline(
  center: NormalizedPoint,
  canonicalStrokeSize: number
): NormalizedOutlinePoint[] {
  const radius = canonicalStrokeSize / 2 / CANONICAL_DRAWING_SIZE;

  return Array.from({ length: DOT_OUTLINE_SEGMENTS }, (_, index) => {
    const angle = (Math.PI * 2 * index) / DOT_OUTLINE_SEGMENTS;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };
  });
}

export function signedOutlineArea(points: NormalizedOutlinePoint[]): number {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

function orientation(
  first: NormalizedOutlinePoint,
  second: NormalizedOutlinePoint,
  third: NormalizedOutlinePoint
): number {
  const value =
    (second.y - first.y) * (third.x - second.x) -
    (second.x - first.x) * (third.y - second.y);

  return Math.abs(value) <= GEOMETRY_EPSILON ? 0 : value;
}

function samePoint(
  first: NormalizedOutlinePoint,
  second: NormalizedOutlinePoint,
  tolerance = GEOMETRY_EPSILON
): boolean {
  return (
    Math.abs(first.x - second.x) <= tolerance &&
    Math.abs(first.y - second.y) <= tolerance
  );
}

function segmentsIntersect(
  firstStart: NormalizedOutlinePoint,
  firstEnd: NormalizedOutlinePoint,
  secondStart: NormalizedOutlinePoint,
  secondEnd: NormalizedOutlinePoint
): boolean {
  if (
    samePoint(firstStart, secondStart) ||
    samePoint(firstStart, secondEnd) ||
    samePoint(firstEnd, secondStart) ||
    samePoint(firstEnd, secondEnd) ||
    samePoint(firstStart, secondStart, ENDPOINT_INTERSECTION_TOLERANCE) ||
    samePoint(firstStart, secondEnd, ENDPOINT_INTERSECTION_TOLERANCE) ||
    samePoint(firstEnd, secondStart, ENDPOINT_INTERSECTION_TOLERANCE) ||
    samePoint(firstEnd, secondEnd, ENDPOINT_INTERSECTION_TOLERANCE)
  ) {
    return false;
  }

  const firstOrientation = orientation(firstStart, firstEnd, secondStart);
  const secondOrientation = orientation(firstStart, firstEnd, secondEnd);
  const thirdOrientation = orientation(secondStart, secondEnd, firstStart);
  const fourthOrientation = orientation(secondStart, secondEnd, firstEnd);

  if (
    Math.sign(firstOrientation) !== Math.sign(secondOrientation) &&
    Math.sign(thirdOrientation) !== Math.sign(fourthOrientation)
  ) {
    return true;
  }

  return false;
}

export function hasSelfIntersection(points: NormalizedOutlinePoint[]): boolean {
  for (let firstIndex = 0; firstIndex < points.length; firstIndex += 1) {
    const firstNext = (firstIndex + 1) % points.length;

    for (let secondIndex = firstIndex + 1; secondIndex < points.length; secondIndex += 1) {
      const secondNext = (secondIndex + 1) % points.length;

      if (
        firstIndex === secondIndex ||
        firstNext === secondIndex ||
        secondNext === firstIndex
      ) {
        continue;
      }

      if (segmentsIntersect(points[firstIndex], points[firstNext], points[secondIndex], points[secondNext])) {
        return true;
      }
    }
  }

  return false;
}

export function validateOutlinePolygon(points: NormalizedOutlinePoint[]): boolean {
  if (points.length < 3) {
    return false;
  }

  const uniquePoints = new Set(points.map((point) => `${point.x}:${point.y}`));

  if (uniquePoints.size < 3) {
    return false;
  }

  if (!points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))) {
    return false;
  }

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    if (current.x === next.x && current.y === next.y) {
      return false;
    }
  }

  if (Math.abs(signedOutlineArea(points)) <= Number.EPSILON) {
    return false;
  }

  return !hasSelfIntersection(points);
}

export function getCanonicalStrokeOutline(
  stroke: DrawingStroke
): NormalizedOutlinePoint[] {
  const points = getValidStrokePoints(stroke);

  if (points.length === 0) {
    return [];
  }

  const canonicalStrokeSize = getCanonicalStrokeSize(stroke);

  if (points.length === 1) {
    return buildDotOutline(points[0], canonicalStrokeSize);
  }

  const outline = getStroke(
    points.map((point) => [
      point.x * CANONICAL_DRAWING_SIZE,
      point.y * CANONICAL_DRAWING_SIZE,
      point.pressure
    ]),
    {
      ...FREEHAND_STROKE_OPTIONS,
      size: canonicalStrokeSize,
      simulatePressure: false,
      start: { cap: true, taper: 0 },
      end: { cap: true, taper: 0 },
      last: true
    }
  );

  return outline.map(([x, y]) => ({
    x: x / CANONICAL_DRAWING_SIZE,
    y: y / CANONICAL_DRAWING_SIZE
  }));
}

export function getValidCanonicalStrokeOutline(
  stroke: DrawingStroke
): NormalizedOutlinePoint[] {
  const outline = getCanonicalStrokeOutline(stroke);

  if (!validateOutlinePolygon(outline)) {
    throw new Error(STROKE_OUTLINE_ERROR);
  }

  return outline;
}
