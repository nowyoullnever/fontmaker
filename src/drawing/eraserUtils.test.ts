import { describe, expect, it } from "vitest";
import type { DrawingStroke } from "./drawingTypes";
import {
  findTouchedStrokeIds,
  strokeIntersectsEraserPoint
} from "./eraserUtils";

const sparseStroke: DrawingStroke = {
  id: "sparse",
  width: 0.025,
  points: [
    { x: 0.1, y: 0.5, pressure: 0.65, timestamp: 1 },
    { x: 0.9, y: 0.5, pressure: 0.65, timestamp: 2 }
  ]
};

describe("eraser utilities", () => {
  it("removes a touched stroke", () => {
    expect(
      findTouchedStrokeIds(
        [sparseStroke],
        { x: 0.5, y: 0.52 },
        0.04
      )
    ).toEqual(["sparse"]);
  });

  it("uses segment hit testing between sparse stored points", () => {
    expect(
      strokeIntersectsEraserPoint(
        sparseStroke,
        { x: 0.5, y: 0.5 },
        0.01
      )
    ).toBe(true);
  });

  it("does not erase untouched strokes", () => {
    expect(
      findTouchedStrokeIds(
        [sparseStroke],
        { x: 0.5, y: 0.8 },
        0.04
      )
    ).toEqual([]);
  });
});
