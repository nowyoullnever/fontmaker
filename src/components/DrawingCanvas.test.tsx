import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DrawingCanvas } from "./DrawingCanvas";

describe("DrawingCanvas", () => {
  it("accepts touch-style Pointer Events and commits one stroke", () => {
    const onCommitStroke = vi.fn();
    const onEraseStrokes = vi.fn();
    const onGestureActiveChange = vi.fn();

    render(
      <DrawingCanvas
        drawing={{ strokes: [] }}
        tool="pen"
        brushWidth={0.025}
        character="가"
        categoryLabel="한글"
        onCommitStroke={onCommitStroke}
        onEraseStrokes={onEraseStrokes}
        onGestureActiveChange={onGestureActiveChange}
      />
    );

    const canvas = screen.getByLabelText("한글 가 손글씨 입력 캔버스");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 300,
      top: 0,
      width: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    fireEvent.pointerDown(canvas, {
      clientX: 30,
      clientY: 30,
      pointerId: 1,
      pointerType: "touch",
      pressure: 0
    });
    fireEvent.pointerMove(canvas, {
      clientX: 150,
      clientY: 150,
      pointerId: 1,
      pointerType: "touch",
      pressure: 0
    });
    fireEvent.pointerUp(canvas, {
      clientX: 150,
      clientY: 150,
      pointerId: 1,
      pointerType: "touch",
      pressure: 0
    });

    expect(onCommitStroke).toHaveBeenCalledTimes(1);
    expect(onCommitStroke.mock.calls[0][0].points).toHaveLength(2);
    expect(onEraseStrokes).not.toHaveBeenCalled();
  });
});

