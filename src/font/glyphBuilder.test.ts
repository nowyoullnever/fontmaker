import { describe, expect, it } from "vitest";
import { CHARACTER_CATEGORIES, FONT_CHARACTERS } from "../data/characterSet";
import type { ExportableGlyphRecord } from "./fontTypes";
import {
  buildExportGlyphs,
  buildUserGlyph,
  codePointToGlyphName,
  createNotdefGlyph,
  createSpaceGlyph
} from "./glyphBuilder";

const validDrawing = {
  strokes: [
    {
      id: "s",
      width: 0.025,
      points: [
        { x: 0.2, y: 0.2, pressure: 0.65, timestamp: 1 },
        { x: 0.8, y: 0.8, pressure: 0.65, timestamp: 2 }
      ]
    }
  ]
};

describe("glyph builder", () => {
  it("includes completed non-empty glyphs and excludes incomplete or empty glyphs", () => {
    expect(
      buildUserGlyph({ codePoint: 65, completed: true, drawing: validDrawing })
    ).not.toBeNull();
    expect(
      buildUserGlyph({ codePoint: 65, completed: false, drawing: validDrawing })
    ).toBeNull();
    expect(
      buildUserGlyph({ codePoint: 65, completed: true, drawing: { strokes: [] } })
    ).toBeNull();
  });

  it("sorts exported glyphs by unicode after .notdef and space", () => {
    const glyphs = buildExportGlyphs([
      { codePoint: 97, completed: true, drawing: validDrawing },
      { codePoint: 65, completed: true, drawing: validDrawing }
    ]);

    expect(glyphs.map((glyph) => glyph.name).slice(0, 4)).toEqual([
      ".notdef",
      "space",
      "uni0041",
      "uni0061"
    ]);
  });

  it("generates deterministic unicode glyph names", () => {
    expect(codePointToGlyphName(0x41)).toBe("uni0041");
    expect(codePointToGlyphName(0xac00)).toBe("uniAC00");
  });

  it("creates .notdef first shape and space glyph", () => {
    expect(createNotdefGlyph().contours).toHaveLength(2);
    expect(createSpaceGlyph()).toMatchObject({
      unicode: [32],
      advanceWidth: 500,
      contours: []
    });
  });

  it("keeps Korean and punctuation Unicode mappings", () => {
    expect(
      buildUserGlyph({ codePoint: 0xac00, completed: true, drawing: validDrawing })?.unicode
    ).toEqual([0xac00]);
    expect(
      buildUserGlyph({ codePoint: 0x3f, completed: true, drawing: validDrawing })?.unicode
    ).toEqual([0x3f]);
  });

  it("rejects unknown code points and keeps existing character counts", () => {
    expect(
      buildUserGlyph({ codePoint: 999999, completed: true, drawing: validDrawing })
    ).toBeNull();
    expect(CHARACTER_CATEGORIES.map((category) => category.characters.length)).toEqual([
      26,
      26,
      10,
      32,
      2350
    ]);
    expect(FONT_CHARACTERS).toHaveLength(2444);
  });
});

