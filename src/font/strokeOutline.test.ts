import { describe, expect, it } from "vitest";
import type { DrawingStroke } from "../drawing/drawingTypes";
import { getCanonicalStrokeOutline, hasSelfIntersection } from "../drawing/strokeGeometry";
import {
  getStrokeSourceOutline,
  normalizedOutlineToFontContour,
  normalizedPointToFontPoint,
  normalizedStrokeWidthToFontUnits,
  strokeToContours
} from "./strokeOutline";
import {
  finalizeContour,
  normalizeContourWinding,
  signedContourArea,
  simplifyContour
} from "./contourUtils";

function makeStroke(points: DrawingStroke["points"], width = 0.025): DrawingStroke {
  return { id: "s", width, points };
}

describe("stroke outline conversion", () => {
  it("converts normalized coordinates into font coordinates and flips Y", () => {
    expect(
      normalizedPointToFontPoint({ x: 0, y: 0, pressure: 0.65, timestamp: 1 })
    ).toMatchObject({ x: 50, y: 800 });
    expect(
      normalizedPointToFontPoint({ x: 1, y: 1, pressure: 0.65, timestamp: 1 })
    ).toMatchObject({ x: 950, y: -100 });
  });

  it("converts stroke width to font units", () => {
    expect(normalizedStrokeWidthToFontUnits(0.025, 0.65)).toBeGreaterThan(20);
  });

  it("creates a valid closed dot contour for a single point", () => {
    const contours = strokeToContours(
      makeStroke([{ x: 0.5, y: 0.5, pressure: 0.65, timestamp: 1 }])
    );

    expect(contours).toHaveLength(1);
    expect(contours[0].length).toBeGreaterThanOrEqual(3);
  });

  it("creates a valid outline for two-point and multi-point strokes", () => {
    const twoPoint = strokeToContours(
      makeStroke([
        { x: 0.1, y: 0.1, pressure: 0.65, timestamp: 1 },
        { x: 0.9, y: 0.9, pressure: 0.65, timestamp: 2 }
      ])
    );
    const multiPoint = strokeToContours(
      makeStroke([
        { x: 0.1, y: 0.1, pressure: 0.65, timestamp: 1 },
        { x: 0.5, y: 0.2, pressure: 0.65, timestamp: 2 },
        { x: 0.9, y: 0.8, pressure: 0.65, timestamp: 3 }
      ])
    );

    expect(twoPoint[0].length).toBeGreaterThanOrEqual(3);
    expect(multiPoint[0].length).toBeGreaterThanOrEqual(3);
    expect(multiPoint[0].length).toBeGreaterThan(6);
  });

  it("removes duplicate points and avoids NaN for degenerate segments", () => {
    const contours = strokeToContours(
      makeStroke([
        { x: 0.5, y: 0.5, pressure: 0.65, timestamp: 1 },
        { x: 0.5, y: 0.5, pressure: 0.65, timestamp: 2 },
        { x: 0.7, y: 0.5, pressure: 0.65, timestamp: 3 }
      ])
    );

    expect(contours[0].every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });

  it("simplifies collinear points and normalizes winding deterministically", () => {
    const contour = [
      { x: 0, y: 0, onCurve: true as const },
      { x: 10, y: 0, onCurve: true as const },
      { x: 20, y: 0, onCurve: true as const },
      { x: 20, y: 20, onCurve: true as const },
      { x: 0, y: 20, onCurve: true as const }
    ];
    const simplified = simplifyContour(contour);
    const normalized = normalizeContourWinding(simplified, true);

    expect(simplified.length).toBeLessThan(contour.length);
    expect(signedContourArea(normalized)).toBeLessThan(0);
    expect(finalizeContour(contour)?.every((point) => Number.isFinite(point.x))).toBe(true);
  });

  it("different brush widths produce different outlines and source data is not mutated", () => {
    const source = makeStroke([
      { x: 0.2, y: 0.2, pressure: 0.65, timestamp: 1 },
      { x: 0.8, y: 0.2, pressure: 0.65, timestamp: 2 }
    ]);
    const before = JSON.stringify(source);
    const thin = strokeToContours({ ...source, width: 0.012 });
    const thick = strokeToContours({ ...source, width: 0.045 });

    expect(JSON.stringify(source)).toBe(before);
    expect(Math.abs(thick[0][0].y - thick[0][thick[0].length - 2].y)).not.toBe(
      Math.abs(thin[0][0].y - thin[0][thin[0].length - 2].y)
    );
  });

  it("uses the same normalized outline source for preview and TTF export", () => {
    const stroke = makeStroke([
      { x: 0.2, y: 0.3, pressure: 0.65, timestamp: 1 },
      { x: 0.45, y: 0.2, pressure: 0.65, timestamp: 2 },
      { x: 0.75, y: 0.7, pressure: 0.65, timestamp: 3 }
    ]);

    expect(getStrokeSourceOutline(stroke)).toEqual(getCanonicalStrokeOutline(stroke));
  });

  it("round-trips TTF contour points back near their normalized outline source", () => {
    const stroke = makeStroke([
      { x: 0.75, y: 0.22, pressure: 0.65, timestamp: 1 },
      { x: 0.35, y: 0.25, pressure: 0.65, timestamp: 2 },
      { x: 0.22, y: 0.5, pressure: 0.65, timestamp: 3 },
      { x: 0.35, y: 0.75, pressure: 0.65, timestamp: 4 },
      { x: 0.75, y: 0.78, pressure: 0.65, timestamp: 5 }
    ]);
    const outline = getStrokeSourceOutline(stroke);
    const contour = normalizedOutlineToFontContour(outline);

    expect(contour).not.toBeNull();
    expect(contour?.length).toBeGreaterThan(stroke.points.length * 4);
    expect(
      contour?.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    ).toBe(true);
    expect(hasSelfIntersection(outline)).toBe(false);

    const roundTripped = contour?.map((point) => ({
      x: (point.x - 50) / 900,
      y: (800 - point.y) / 900
    }));

    expect(roundTripped?.[0].x).toBeCloseTo(outline[0].x, 3);
    expect(roundTripped?.[0].y).toBeCloseTo(outline[0].y, 3);
  });
});
