import type { DrawingStroke, GlyphDrawing, NormalizedPoint } from "../drawing/drawingTypes";
import { getKnownCodePointSet, isKnownCodePoint } from "../management/characterManagement";
import {
  BACKUP_SCHEMA_VERSION,
  CHARACTER_SET_VERSION,
  type FontmakerBackup,
  type StoredGlyphRecord
} from "./storageTypes";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidNormalizedNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isValidPoint(value: unknown): value is NormalizedPoint {
  return (
    isObject(value) &&
    isValidNormalizedNumber(value.x) &&
    isValidNormalizedNumber(value.y) &&
    isValidNormalizedNumber(value.pressure) &&
    typeof value.timestamp === "number" &&
    Number.isFinite(value.timestamp)
  );
}

function isValidStroke(value: unknown): value is DrawingStroke {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isValidNormalizedNumber(value.width) &&
    Array.isArray(value.points) &&
    value.points.every(isValidPoint)
  );
}

function isValidDrawing(value: unknown): value is GlyphDrawing {
  return (
    isObject(value) &&
    Array.isArray(value.strokes) &&
    value.strokes.every(isValidStroke)
  );
}

export function createBackup(
  glyphs: StoredGlyphRecord[],
  lastCodePoint: number,
  now = new Date()
): FontmakerBackup {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    characterSetVersion: CHARACTER_SET_VERSION,
    exportedAt: now.toISOString(),
    lastCodePoint,
    glyphs
  };
}

export function validateStoredGlyphRecord(value: unknown): StoredGlyphRecord {
  if (!isObject(value)) {
    throw new Error("glyph must be an object");
  }

  if (
    typeof value.codePoint !== "number" ||
    !Number.isInteger(value.codePoint) ||
    !isKnownCodePoint(value.codePoint)
  ) {
    throw new Error("unknown code point");
  }

  if (!isValidDrawing(value.drawing)) {
    throw new Error("invalid drawing");
  }

  if (typeof value.completed !== "boolean") {
    throw new Error("invalid completion");
  }

  if (typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt)) {
    throw new Error("invalid updatedAt");
  }

  return {
    codePoint: value.codePoint,
    drawing: value.drawing,
    completed: value.completed,
    updatedAt: value.updatedAt
  };
}

export function validateBackup(value: unknown): FontmakerBackup {
  if (!isObject(value)) {
    throw new Error("backup must be an object");
  }

  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error("unsupported schema version");
  }

  if (value.characterSetVersion !== CHARACTER_SET_VERSION) {
    throw new Error("unsupported character set version");
  }

  if (typeof value.exportedAt !== "string") {
    throw new Error("invalid exportedAt");
  }

  if (
    typeof value.lastCodePoint !== "number" ||
    !getKnownCodePointSet().has(value.lastCodePoint)
  ) {
    throw new Error("invalid last code point");
  }

  if (!Array.isArray(value.glyphs)) {
    throw new Error("invalid glyph list");
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    characterSetVersion: CHARACTER_SET_VERSION,
    exportedAt: value.exportedAt,
    lastCodePoint: value.lastCodePoint,
    glyphs: value.glyphs.map(validateStoredGlyphRecord)
  };
}

export function parseBackupJson(json: string): FontmakerBackup {
  return validateBackup(JSON.parse(json));
}

export function buildBackupFilename(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `fontmaker-backup-${yyyy}-${mm}-${dd}.json`;
}

