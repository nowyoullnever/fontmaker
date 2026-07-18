import type { DrawingStroke, NormalizedPoint } from "../drawing/drawingTypes";
import {
  FONT_METRICS,
  type FontContour,
  type FontPoint
} from "./fontTypes";
import { finalizeContour } from "./contourUtils";

const MIN_DISTANCE = 0.001;
const DOT_SEGMENTS = 16;
const CAP_SEGMENTS = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizedPointToFontPoint(point: NormalizedPoint): FontPoint {
  return {
    x: FONT_METRICS.drawableMinX + point.x * FONT_METRICS.drawableSize,
    y: FONT_METRICS.drawableTopY - point.y * FONT_METRICS.drawableSize,
    onCurve: true
  };
}

export function normalizedStrokeWidthToFontUnits(
  width: number,
  pressure = 0.65
): number {
  const pressureMultiplier = clamp(0.85 + pressure * 0.3, 0.85, 1.15);
  return Math.max(4, width * FONT_METRICS.drawableSize * pressureMultiplier);
}

function averagePressure(points: NormalizedPoint[]): number {
  if (points.length === 0) {
    return 0.65;
  }

  return points.reduce((sum, point) => sum + point.pressure, 0) / points.length;
}

function removeNearDuplicateNormalizedPoints(
  points: NormalizedPoint[]
): NormalizedPoint[] {
  const result: NormalizedPoint[] = [];

  for (const point of points) {
    if (
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(point.pressure)
    ) {
      continue;
    }

    const previous = result[result.length - 1];
    if (
      previous &&
      Math.hypot(point.x - previous.x, point.y - previous.y) < MIN_DISTANCE
    ) {
      continue;
    }

    result.push(point);
  }

  return result;
}

function circleContour(center: FontPoint, radius: number): FontContour {
  return Array.from({ length: DOT_SEGMENTS }, (_, index) => {
    const angle = (Math.PI * 2 * index) / DOT_SEGMENTS;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      onCurve: true
    };
  });
}

function capPoints(
  center: FontPoint,
  normalX: number,
  normalY: number,
  radius: number,
  startAngleOffset: number
): FontContour {
  return Array.from({ length: CAP_SEGMENTS + 1 }, (_, index) => {
    const t = index / CAP_SEGMENTS;
    const baseAngle = Math.atan2(normalY, normalX);
    const angle = baseAngle + startAngleOffset + Math.PI * t;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      onCurve: true
    };
  });
}

export function strokeToContours(stroke: DrawingStroke): FontContour[] {
  const cleanPoints = removeNearDuplicateNormalizedPoints(stroke.points);

  if (cleanPoints.length === 0) {
    return [];
  }

  const radius =
    normalizedStrokeWidthToFontUnits(stroke.width, averagePressure(cleanPoints)) /
    2;

  if (cleanPoints.length === 1) {
    const finalized = finalizeContour(
      circleContour(normalizedPointToFontPoint(cleanPoints[0]), radius)
    );
    return finalized ? [finalized] : [];
  }

  const fontPoints = cleanPoints.map(normalizedPointToFontPoint);
  const leftEdge: FontContour = [];
  const rightEdge: FontContour = [];
  const normals = fontPoints.map((point, index) => {
    const previous = fontPoints[Math.max(0, index - 1)];
    const next = fontPoints[Math.min(fontPoints.length - 1, index + 1)];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
      return { x: 0, y: 1 };
    }

    return { x: -dy / length, y: dx / length };
  });

  fontPoints.forEach((point, index) => {
    const normal = normals[index];
    leftEdge.push({
      x: point.x + normal.x * radius,
      y: point.y + normal.y * radius,
      onCurve: true
    });
    rightEdge.push({
      x: point.x - normal.x * radius,
      y: point.y - normal.y * radius,
      onCurve: true
    });
  });

  const startNormal = normals[0];
  const endNormal = normals[normals.length - 1];
  const endCap = capPoints(
    fontPoints[fontPoints.length - 1],
    endNormal.x,
    endNormal.y,
    radius,
    0
  );
  const startCap = capPoints(
    fontPoints[0],
    -startNormal.x,
    -startNormal.y,
    radius,
    0
  );
  const rawContour = [
    ...leftEdge,
    ...endCap,
    ...rightEdge.reverse(),
    ...startCap
  ];
  const finalized = finalizeContour(rawContour);

  return finalized ? [finalized] : [];
}

