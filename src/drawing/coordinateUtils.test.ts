import { describe, expect, it } from "vitest";
import {
  clampNormalizedValue,
  clientPointToNormalizedPoint
} from "./coordinateUtils";

describe("coordinate utilities", () => {
  it("converts pixel coordinates into normalized coordinates", () => {
    const point = clientPointToNormalizedPoint(
      150,
      250,
      { left: 100, top: 200, width: 200, height: 200 },
      0.5,
      "pen",
      123
    );

    expect(point).toEqual({
      x: 0.25,
      y: 0.25,
      pressure: 0.5,
      timestamp: 123
    });
  });

  it("clamps normalized coordinates to the 0 through 1 range", () => {
    expect(clampNormalizedValue(-0.25)).toBe(0);
    expect(clampNormalizedValue(1.25)).toBe(1);
    expect(clampNormalizedValue(0.5)).toBe(0.5);
  });

  it("uses fallback pressure for touch and mouse input", () => {
    expect(
      clientPointToNormalizedPoint(
        0,
        0,
        { left: 0, top: 0, width: 100, height: 100 },
        0,
        "touch"
      ).pressure
    ).toBe(0.65);
    expect(
      clientPointToNormalizedPoint(
        0,
        0,
        { left: 0, top: 0, width: 100, height: 100 },
        0,
        "mouse"
      ).pressure
    ).toBe(0.65);
  });
});

