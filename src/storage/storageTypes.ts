import type { BrushSizeId, DrawingTool, GlyphDrawing } from "../drawing/drawingTypes";

export const BACKUP_SCHEMA_VERSION = 1;
export const CHARACTER_SET_VERSION = 1;

export type StoredGlyphRecord = {
  codePoint: number;
  drawing: GlyphDrawing;
  completed: boolean;
  updatedAt: number;
};

export type StoredWorkspaceSettings = {
  lastCodePoint: number;
  selectedTool: DrawingTool;
  selectedBrushSize: BrushSizeId;
};

export type FontmakerBackup = {
  schemaVersion: 1;
  characterSetVersion: 1;
  exportedAt: string;
  lastCodePoint: number;
  glyphs: StoredGlyphRecord[];
};

