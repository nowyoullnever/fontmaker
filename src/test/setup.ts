import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

(HTMLCanvasElement.prototype.getContext as unknown) = function getContext() {
  return {
    arc: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fill: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    lineCap: "round",
    lineJoin: "round",
    lineWidth: 1,
    strokeStyle: ""
  } as unknown as CanvasRenderingContext2D;
};

Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.hasPointerCapture = vi.fn(() => true);


