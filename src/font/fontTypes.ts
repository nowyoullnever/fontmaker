import type { GlyphDrawing } from "../drawing/drawingTypes";

export const FONT_METRICS = {
  unitsPerEm: 1000,
  ascender: 850,
  descender: -150,
  defaultAdvanceWidth: 1000,
  spaceAdvanceWidth: 500,
  drawableMinX: 50,
  drawableMaxX: 950,
  drawableTopY: 800,
  drawableBottomY: -100,
  drawableSize: 900
} as const;

export type FontPoint = {
  x: number;
  y: number;
  onCurve: true;
};

export type FontContour = FontPoint[];

export type ExportableGlyphRecord = {
  codePoint: number;
  drawing: GlyphDrawing;
  completed: boolean;
};

export type BuiltGlyph = {
  name: string;
  unicode: number[];
  advanceWidth: number;
  leftSideBearing: number;
  contours: FontContour[];
};

export type FontBuildInput = {
  familyName: string;
  glyphs: ExportableGlyphRecord[];
};

export type FontBuildResult = {
  arrayBuffer: ArrayBuffer;
  filename: string;
  glyphCount: number;
  exportedCodePoints: number[];
};

