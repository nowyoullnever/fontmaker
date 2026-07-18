import type { DrawingStroke, NormalizedPoint } from "../drawing/drawingTypes";
import {
  getStrokePressureScale,
  getValidCanonicalStrokeOutline,
  type NormalizedOutlinePoint
} from "../drawing/strokeGeometry";
import { normalizeContourWinding, signedContourArea } from "./contourUtils";
import {
  FONT_METRICS,
  type FontContour,
  type FontPoint
} from "./fontTypes";

export function normalizedPointToFontPoint(
  point: NormalizedPoint | NormalizedOutlinePoint
): FontPoint {
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
  const pressureScale = 0.88 + pressure * 0.24;
  return Math.max(4, width * FONT_METRICS.drawableSize * pressureScale);
}

export function normalizedOutlineToFontContour(
  outline: NormalizedOutlinePoint[]
): FontContour | null {
  const rounded = outline
    .map((point) => normalizedPointToFontPoint(point))
    .map((point) => ({
      x: Math.round(point.x),
      y: Math.round(point.y),
      onCurve: true as const
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const deduped: FontContour = [];

  for (const point of rounded) {
    const previous = deduped[deduped.length - 1];

    if (previous && previous.x === point.x && previous.y === point.y) {
      continue;
    }

    deduped.push(point);
  }

  if (
    deduped.length > 1 &&
    deduped[0].x === deduped[deduped.length - 1].x &&
    deduped[0].y === deduped[deduped.length - 1].y
  ) {
    deduped.pop();
  }

  const uniquePoints = new Set(deduped.map((point) => `${point.x}:${point.y}`));

  if (deduped.length < 3 || uniquePoints.size < 3) {
    return null;
  }

  for (let index = 0; index < deduped.length; index += 1) {
    const current = deduped[index];
    const next = deduped[(index + 1) % deduped.length];

    if (current.x === next.x && current.y === next.y) {
      return null;
    }
  }

  if (Math.abs(signedContourArea(deduped)) <= Number.EPSILON) {
    return null;
  }

  return normalizeContourWinding(deduped, true);
}

export function getStrokeSourceOutline(
  stroke: DrawingStroke
): NormalizedOutlinePoint[] {
  return getValidCanonicalStrokeOutline(stroke);
}

export function strokeToContours(stroke: DrawingStroke): FontContour[] {
  const contour = normalizedOutlineToFontContour(getStrokeSourceOutline(stroke));

  return contour ? [contour] : [];
}

export function getStrokeFontWidthForTests(
  stroke: DrawingStroke
): number {
  return stroke.width * FONT_METRICS.drawableSize * getStrokePressureScale(stroke.points);
}
