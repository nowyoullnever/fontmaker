import { describe, expect, it } from "vitest";
import {
  drawingReducer,
  getGlyphDrawing,
  getGlyphHistory
} from "./drawingReducer";
import type { DrawingStroke, GlyphDrawingMap } from "./drawingTypes";

function makeStroke(id: string, width = 0.025): DrawingStroke {
  return {
    id,
    width,
    points: [
      { x: 0.1, y: 0.1, pressure: 0.65, timestamp: 1 },
      { x: 0.9, y: 0.9, pressure: 0.65, timestamp: 2 }
    ]
  };
}

describe("drawing reducer", () => {
  it("adds a completed stroke only to the current character", () => {
    const state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });

    expect(getGlyphDrawing(state, 65).strokes).toHaveLength(1);
    expect(getGlyphDrawing(state, 66).strokes).toHaveLength(0);
  });

  it("preserves in-memory drawing when navigating away and returning", () => {
    const state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });

    expect(getGlyphDrawing(state, 66).strokes).toHaveLength(0);
    expect(getGlyphDrawing(state, 65).strokes[0].id).toBe("a");
  });

  it("keeps different characters separate", () => {
    let state: GlyphDrawingMap = {};
    state = drawingReducer(state, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });
    state = drawingReducer(state, {
      type: "addStroke",
      codePoint: 66,
      stroke: makeStroke("b")
    });

    expect(getGlyphDrawing(state, 65).strokes.map((stroke) => stroke.id)).toEqual([
      "a"
    ]);
    expect(getGlyphDrawing(state, 66).strokes.map((stroke) => stroke.id)).toEqual([
      "b"
    ]);
  });

  it("undo restores the state before a pen stroke", () => {
    let state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });
    state = drawingReducer(state, { type: "undo", codePoint: 65 });

    expect(getGlyphDrawing(state, 65).strokes).toHaveLength(0);
  });

  it("redo restores an undone pen stroke", () => {
    let state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });
    state = drawingReducer(state, { type: "undo", codePoint: 65 });
    state = drawingReducer(state, { type: "redo", codePoint: 65 });

    expect(getGlyphDrawing(state, 65).strokes[0].id).toBe("a");
  });

  it("new drawing after undo clears redo history", () => {
    let state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });
    state = drawingReducer(state, { type: "undo", codePoint: 65 });
    state = drawingReducer(state, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("b")
    });

    expect(getGlyphHistory(state, 65).redoStack).toHaveLength(0);
    expect(getGlyphDrawing(state, 65).strokes.map((stroke) => stroke.id)).toEqual([
      "b"
    ]);
  });

  it("clearing the current glyph is one undoable action", () => {
    let state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });
    state = drawingReducer(state, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("b")
    });
    state = drawingReducer(state, { type: "clearGlyph", codePoint: 65 });

    expect(getGlyphDrawing(state, 65).strokes).toHaveLength(0);
    expect(getGlyphHistory(state, 65).undoStack).toHaveLength(3);
  });

  it("undo after clear restores all previous strokes", () => {
    let state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });
    state = drawingReducer(state, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("b")
    });
    state = drawingReducer(state, { type: "clearGlyph", codePoint: 65 });
    state = drawingReducer(state, { type: "undo", codePoint: 65 });

    expect(getGlyphDrawing(state, 65).strokes.map((stroke) => stroke.id)).toEqual([
      "a",
      "b"
    ]);
  });

  it("one eraser gesture creates one undo action", () => {
    let state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });
    state = drawingReducer(state, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("b")
    });
    state = drawingReducer(state, {
      type: "eraseStrokes",
      codePoint: 65,
      strokeIds: ["a", "b"]
    });

    expect(getGlyphDrawing(state, 65).strokes).toHaveLength(0);
    expect(getGlyphHistory(state, 65).undoStack).toHaveLength(3);
  });

  it("brush-size changes affect new strokes but not existing strokes", () => {
    let state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("thin", 0.012)
    });
    state = drawingReducer(state, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("thick", 0.045)
    });

    expect(getGlyphDrawing(state, 65).strokes.map((stroke) => stroke.width)).toEqual([
      0.012,
      0.045
    ]);
  });

  it("retains a single-point stroke as a valid dot", () => {
    const dot: DrawingStroke = {
      id: "dot",
      width: 0.025,
      points: [{ x: 0.5, y: 0.5, pressure: 0.65, timestamp: 1 }]
    };
    const state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: dot
    });

    expect(getGlyphDrawing(state, 65).strokes[0]).toEqual(dot);
  });

  it("does not include guide character data in glyph drawings", () => {
    const state = drawingReducer({}, {
      type: "addStroke",
      codePoint: 65,
      stroke: makeStroke("a")
    });

    expect(getGlyphDrawing(state, 65)).toEqual({
      strokes: [makeStroke("a")]
    });
  });
});

