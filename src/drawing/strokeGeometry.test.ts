import { describe, expect, it } from "vitest";
import type { DrawingStroke } from "./drawingTypes";
import {
  CANONICAL_DRAWING_SIZE,
  DOT_OUTLINE_SEGMENTS,
  FREEHAND_STROKE_OPTIONS,
  getCanonicalStrokeOutline,
  getStrokePressureScale,
  hasSelfIntersection,
  signedOutlineArea,
  validateOutlinePolygon
} from "./strokeGeometry";

function makeStroke(points: DrawingStroke["points"], width = 0.025): DrawingStroke {
  return { id: "fixture", width, points };
}

function point(x: number, y: number, index: number, pressure = 0.65) {
  return { x, y, pressure, timestamp: index };
}

function bounds(outline: Array<{ x: number; y: number }>) {
  return {
    xMin: Math.min(...outline.map((outlinePoint) => outlinePoint.x)),
    yMin: Math.min(...outline.map((outlinePoint) => outlinePoint.y)),
    xMax: Math.max(...outline.map((outlinePoint) => outlinePoint.x)),
    yMax: Math.max(...outline.map((outlinePoint) => outlinePoint.y))
  };
}

const fixtures = {
  horizontal: makeStroke([point(0.18, 0.5, 1), point(0.82, 0.5, 2)]),
  diagonal: makeStroke([point(0.18, 0.2, 1), point(0.82, 0.8, 2)]),
  cCurve: makeStroke([
    point(0.75, 0.22, 1),
    point(0.35, 0.25, 2),
    point(0.22, 0.5, 3),
    point(0.35, 0.75, 4),
    point(0.75, 0.78, 5)
  ]),
  sCurve: makeStroke([
    point(0.62, 0.18, 1),
    point(0.48, 0.3, 2),
    point(0.52, 0.42, 3),
    point(0.48, 0.56, 4),
    point(0.62, 0.72, 5)
  ]),
  uTurn: makeStroke([
    point(0.3, 0.25, 1),
    point(0.3, 0.7, 2),
    point(0.5, 0.82, 3),
    point(0.7, 0.7, 4),
    point(0.7, 0.25, 5)
  ]),
  zigzag: makeStroke([
    point(0.18, 0.35, 1),
    point(0.34, 0.6, 2),
    point(0.5, 0.4, 3),
    point(0.66, 0.6, 4),
    point(0.82, 0.35, 5)
  ]),
  loopLike: makeStroke([
    point(0.42, 0.38, 1),
    point(0.58, 0.38, 2),
    point(0.62, 0.5, 3),
    point(0.5, 0.6, 4),
    point(0.38, 0.52, 5),
    point(0.44, 0.42, 6)
  ]),
  dot: makeStroke([point(0.5, 0.5, 1)])
};

describe("stroke geometry", () => {
  it("uses canonical 1000-unit freehand options", () => {
    expect(CANONICAL_DRAWING_SIZE).toBe(1000);
    expect(FREEHAND_STROKE_OPTIONS).toEqual({
      thinning: 0,
      smoothing: 0.7,
      streamline: 0.35
    });
  });

  it("is deterministic and does not mutate the input stroke", () => {
    const before = JSON.stringify(fixtures.cCurve);
    const first = getCanonicalStrokeOutline(fixtures.cCurve);
    const second = getCanonicalStrokeOutline(fixtures.cCurve);

    expect(second).toEqual(first);
    expect(JSON.stringify(fixtures.cCurve)).toBe(before);
  });

  it("returns finite normalized non-zero polygons with consistent winding", () => {
    for (const stroke of Object.values(fixtures)) {
      const outline = getCanonicalStrokeOutline(stroke);

      expect(outline.length).toBeGreaterThanOrEqual(3);
      expect(outline.every((outlinePoint) => Number.isFinite(outlinePoint.x))).toBe(true);
      expect(outline.every((outlinePoint) => Number.isFinite(outlinePoint.y))).toBe(true);
      expect(validateOutlinePolygon(outline)).toBe(true);
      expect(signedOutlineArea(outline)).toBeGreaterThan(0);
    }
  });

  it("creates a circular-enough shared fallback for a single point", () => {
    const outline = getCanonicalStrokeOutline(fixtures.dot);
    const distances = outline.map((outlinePoint) =>
      Math.hypot(outlinePoint.x - 0.5, outlinePoint.y - 0.5)
    );
    const averageDistance =
      distances.reduce((sum, distance) => sum + distance, 0) / distances.length;

    expect(outline).toHaveLength(DOT_OUTLINE_SEGMENTS);
    for (const distance of distances) {
      expect(Math.abs(distance - averageDistance)).toBeLessThan(0.001);
    }
  });

  it("keeps brush sizes visually distinct", () => {
    const thin = bounds(getCanonicalStrokeOutline({ ...fixtures.horizontal, width: 0.012 }));
    const medium = bounds(getCanonicalStrokeOutline({ ...fixtures.horizontal, width: 0.025 }));
    const thick = bounds(getCanonicalStrokeOutline({ ...fixtures.horizontal, width: 0.045 }));

    expect(medium.yMax - medium.yMin).toBeGreaterThan(thin.yMax - thin.yMin);
    expect(thick.yMax - thick.yMin).toBeGreaterThan(medium.yMax - medium.yMin);
  });

  it("preserves the previous average pressure scale formula", () => {
    const scale = getStrokePressureScale([
      point(0.1, 0.1, 1, 0.2),
      point(0.2, 0.2, 2, 0.8)
    ]);

    expect(scale).toBeCloseTo(0.88 + 0.5 * 0.24);
  });

  it("keeps curved and sharp fixture outlines dense and non-self-intersecting", () => {
    for (const fixtureName of ["cCurve", "sCurve", "uTurn", "zigzag", "loopLike"] as const) {
      const stroke = fixtures[fixtureName];
      const outline = getCanonicalStrokeOutline(stroke);

      expect(outline.length).toBeGreaterThan(stroke.points.length * 4);
      expect(hasSelfIntersection(outline)).toBe(false);
    }
  });
});
