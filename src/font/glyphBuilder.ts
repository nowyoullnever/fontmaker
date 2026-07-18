import { FONT_CHARACTERS } from "../data/characterSet";
import type { GlyphDrawing } from "../drawing/drawingTypes";
import { isKnownCodePoint } from "../management/characterManagement";
import { rectangleContour } from "./contourUtils";
import { strokeToContours } from "./strokeOutline";
import {
  FONT_METRICS,
  type BuiltGlyph,
  type FontContour,
  type ExportableGlyphRecord
} from "./fontTypes";

export function codePointToGlyphName(codePoint: number): string {
  return `uni${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

export function calculateContourBounds(contours: FontContour[]): Pick<
  BuiltGlyph,
  "xMin" | "yMin" | "xMax" | "yMax"
> {
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;

  for (const contour of contours) {
    for (const point of contour) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        continue;
      }

      xMin = Math.min(xMin, point.x);
      yMin = Math.min(yMin, point.y);
      xMax = Math.max(xMax, point.x);
      yMax = Math.max(yMax, point.y);
    }
  }

  if (
    !Number.isFinite(xMin) ||
    !Number.isFinite(yMin) ||
    !Number.isFinite(xMax) ||
    !Number.isFinite(yMax)
  ) {
    return { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
  }

  return { xMin, yMin, xMax, yMax };
}

export function createNotdefGlyph(): BuiltGlyph {
  const contours = [
    rectangleContour(100, 0, 900, 700, true),
    rectangleContour(180, 80, 820, 620, false)
  ];

  return {
    name: ".notdef",
    unicode: [],
    advanceWidth: FONT_METRICS.defaultAdvanceWidth,
    leftSideBearing: 0,
    ...calculateContourBounds(contours),
    contours
  };
}

export function createSpaceGlyph(): BuiltGlyph {
  return {
    name: "space",
    unicode: [32],
    advanceWidth: FONT_METRICS.spaceAdvanceWidth,
    leftSideBearing: 0,
    xMin: 0,
    yMin: 0,
    xMax: 0,
    yMax: 0,
    contours: []
  };
}

export function drawingHasValidDrawablePoints(drawing: GlyphDrawing): boolean {
  return drawing.strokes.some((stroke) =>
    stroke.points.some(
      (point) =>
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        point.x >= 0 &&
        point.x <= 1 &&
        point.y >= 0 &&
        point.y <= 1
    )
  );
}

export function buildUserGlyph(record: ExportableGlyphRecord): BuiltGlyph | null {
  if (
    !record.completed ||
    record.drawing.strokes.length === 0 ||
    !drawingHasValidDrawablePoints(record.drawing) ||
    !isKnownCodePoint(record.codePoint)
  ) {
    return null;
  }

  const contours = record.drawing.strokes.flatMap(strokeToContours);

  if (contours.length === 0) {
    return null;
  }

  return {
    name: codePointToGlyphName(record.codePoint),
    unicode: [record.codePoint],
    advanceWidth: FONT_METRICS.defaultAdvanceWidth,
    leftSideBearing: 0,
    ...calculateContourBounds(contours),
    contours
  };
}

export function buildExportGlyphs(records: ExportableGlyphRecord[]): BuiltGlyph[] {
  const userGlyphs = records
    .filter((record) => isKnownCodePoint(record.codePoint))
    .sort((first, second) => first.codePoint - second.codePoint)
    .map(buildUserGlyph)
    .filter((glyph): glyph is BuiltGlyph => glyph !== null);

  return [createNotdefGlyph(), createSpaceGlyph(), ...userGlyphs];
}

export function getExportableRecordsFromMaps(
  drawingsByCodePoint: Map<number, GlyphDrawing>,
  completedCodePoints: Set<number>
): ExportableGlyphRecord[] {
  return FONT_CHARACTERS.map((character) => ({
    codePoint: character.codePoint,
    drawing: drawingsByCodePoint.get(character.codePoint) ?? { strokes: [] },
    completed: completedCodePoints.has(character.codePoint)
  }));
}
