export type NormalizedPoint = {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
};

export type DrawingStroke = {
  id: string;
  width: number;
  points: NormalizedPoint[];
};

export type GlyphDrawing = {
  strokes: DrawingStroke[];
};

export type GlyphDrawingHistory = {
  drawing: GlyphDrawing;
  undoStack: GlyphDrawing[];
  redoStack: GlyphDrawing[];
};

export type GlyphDrawingMap = Record<number, GlyphDrawingHistory>;

export type DrawingTool = "pen" | "eraser";

export type BrushSizeId = "thin" | "medium" | "thick";

export type BrushSize = {
  id: BrushSizeId;
  label: string;
  width: number;
};

export const EMPTY_GLYPH_DRAWING: GlyphDrawing = {
  strokes: []
};

export const EMPTY_GLYPH_HISTORY: GlyphDrawingHistory = {
  drawing: EMPTY_GLYPH_DRAWING,
  undoStack: [],
  redoStack: []
};

export const BRUSH_SIZES: BrushSize[] = [
  { id: "thin", label: "가늘게", width: 0.012 },
  { id: "medium", label: "보통", width: 0.025 },
  { id: "thick", label: "굵게", width: 0.045 }
];

export const DEFAULT_BRUSH_SIZE_ID: BrushSizeId = "medium";

export const DEFAULT_TOOL: DrawingTool = "pen";

