import { describe, expect, it, vi } from "vitest";
import type { DrawingStroke } from "./drawingTypes";
import { renderStroke } from "./strokeRenderer";

function makeContext() {
  return {
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    stroke: vi.fn(),
    fillStyle: ""
  } as unknown as CanvasRenderingContext2D & {
    beginPath: ReturnType<typeof vi.fn>;
    closePath: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    lineTo: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    quadraticCurveTo: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
  };
}

const stroke: DrawingStroke = {
  id: "preview",
  width: 0.025,
  points: [
    { x: 0.2, y: 0.2, pressure: 0.65, timestamp: 1 },
    { x: 0.5, y: 0.35, pressure: 0.65, timestamp: 2 },
    { x: 0.8, y: 0.2, pressure: 0.65, timestamp: 3 }
  ]
};

describe("stroke renderer", () => {
  it("renders the shared outline as a filled polygon without quadratic smoothing", () => {
    const context = makeContext();

    renderStroke(context, stroke, 300);

    expect(context.beginPath).toHaveBeenCalled();
    expect(context.moveTo).toHaveBeenCalledTimes(1);
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
    expect(context.fill).toHaveBeenCalled();
    expect(context.quadraticCurveTo).not.toHaveBeenCalled();
    expect(context.stroke).not.toHaveBeenCalled();
  });
});
