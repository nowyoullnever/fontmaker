import type {
  DrawingStroke,
  GlyphDrawing,
  GlyphDrawingHistory,
  GlyphDrawingMap
} from "./drawingTypes";
import { EMPTY_GLYPH_DRAWING, EMPTY_GLYPH_HISTORY } from "./drawingTypes";

export type DrawingAction =
  | {
      type: "hydrate";
      drawingsByCodePoint: Record<number, GlyphDrawing>;
    }
  | {
      type: "addStroke";
      codePoint: number;
      stroke: DrawingStroke;
    }
  | {
      type: "eraseStrokes";
      codePoint: number;
      strokeIds: string[];
    }
  | {
      type: "clearGlyph";
      codePoint: number;
    }
  | {
      type: "undo";
      codePoint: number;
    }
  | {
      type: "redo";
      codePoint: number;
    };

export function getGlyphHistory(
  state: GlyphDrawingMap,
  codePoint: number
): GlyphDrawingHistory {
  return state[codePoint] ?? EMPTY_GLYPH_HISTORY;
}

export function getGlyphDrawing(
  state: GlyphDrawingMap,
  codePoint: number
): GlyphDrawing {
  return getGlyphHistory(state, codePoint).drawing;
}

function drawingsAreEqual(first: GlyphDrawing, second: GlyphDrawing): boolean {
  return first.strokes === second.strokes;
}

function pushHistory(
  history: GlyphDrawingHistory,
  drawing: GlyphDrawing
): GlyphDrawingHistory {
  if (drawingsAreEqual(history.drawing, drawing)) {
    return history;
  }

  return {
    drawing,
    undoStack: [...history.undoStack, history.drawing],
    redoStack: []
  };
}

function setHistory(
  state: GlyphDrawingMap,
  codePoint: number,
  history: GlyphDrawingHistory
): GlyphDrawingMap {
  return {
    ...state,
    [codePoint]: history
  };
}

export function drawingReducer(
  state: GlyphDrawingMap,
  action: DrawingAction
): GlyphDrawingMap {
  if (action.type === "hydrate") {
    return Object.fromEntries(
      Object.entries(action.drawingsByCodePoint).map(([codePoint, drawing]) => [
        codePoint,
        {
          drawing,
          undoStack: [],
          redoStack: []
        }
      ])
    );
  }

  const history = getGlyphHistory(state, action.codePoint);

  switch (action.type) {
    case "addStroke": {
      if (action.stroke.points.length === 0) {
        return state;
      }

      const nextDrawing = {
        strokes: [...history.drawing.strokes, action.stroke]
      };

      return setHistory(
        state,
        action.codePoint,
        pushHistory(history, nextDrawing)
      );
    }

    case "eraseStrokes": {
      const strokeIds = new Set(action.strokeIds);

      if (strokeIds.size === 0) {
        return state;
      }

      const nextStrokes = history.drawing.strokes.filter(
        (stroke) => !strokeIds.has(stroke.id)
      );

      if (nextStrokes.length === history.drawing.strokes.length) {
        return state;
      }

      return setHistory(
        state,
        action.codePoint,
        pushHistory(history, { strokes: nextStrokes })
      );
    }

    case "clearGlyph": {
      if (history.drawing.strokes.length === 0) {
        return state;
      }

      return setHistory(
        state,
        action.codePoint,
        pushHistory(history, EMPTY_GLYPH_DRAWING)
      );
    }

    case "undo": {
      if (history.undoStack.length === 0) {
        return state;
      }

      const previousDrawing = history.undoStack[history.undoStack.length - 1];

      return setHistory(state, action.codePoint, {
        drawing: previousDrawing,
        undoStack: history.undoStack.slice(0, -1),
        redoStack: [history.drawing, ...history.redoStack]
      });
    }

    case "redo": {
      if (history.redoStack.length === 0) {
        return state;
      }

      const nextDrawing = history.redoStack[0];

      return setHistory(state, action.codePoint, {
        drawing: nextDrawing,
        undoStack: [...history.undoStack, history.drawing],
        redoStack: history.redoStack.slice(1)
      });
    }

    default:
      return state;
  }
}
