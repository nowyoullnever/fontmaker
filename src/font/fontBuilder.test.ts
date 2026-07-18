import { describe, expect, it } from "vitest";
import { createBackup } from "../storage/backup";
import { validateBackup } from "../storage/backup";
import { buildExportGlyphs } from "./glyphBuilder";
import { FONT_METRICS, type BuiltGlyph } from "./fontTypes";
import {
  buildTrueTypeFont,
  createDownloadFilename,
  createPostScriptName,
  createTtfObject,
  readGeneratedFont
} from "./fontBuilder";

const drawing = {
  strokes: [
    {
      id: "s",
      width: 0.025,
      points: [
        { x: 0.25, y: 0.25, pressure: 0.65, timestamp: 1 },
        { x: 0.75, y: 0.75, pressure: 0.65, timestamp: 2 }
      ]
    }
  ]
};

type ReadGlyph = {
  unicode?: number[];
  advanceWidth?: number;
  leftSideBearing?: number;
  xMin?: number;
  yMin?: number;
  xMax?: number;
  yMax?: number;
  contours?: Array<Array<{ x: number; y: number }>>;
};

type ReadTtf = {
  head: {
    flags: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
  glyf: ReadGlyph[];
};

function emptyGlyph(overrides: Partial<BuiltGlyph>): BuiltGlyph {
  return {
    name: ".notdef",
    unicode: [],
    advanceWidth: 1000,
    leftSideBearing: 0,
    xMin: 0,
    yMin: 0,
    xMax: 0,
    yMax: 0,
    contours: [],
    ...overrides
  };
}

function glyphByUnicode(read: ReadTtf, codePoint: number): ReadGlyph {
  const glyph = read.glyf.find((item) => item.unicode?.includes(codePoint));

  if (!glyph) {
    throw new Error(`missing glyph ${codePoint}`);
  }

  return glyph;
}

function contourBounds(glyph: ReadGlyph) {
  const points = (glyph.contours ?? []).flat();

  return {
    xMin: Math.min(...points.map((point) => point.x)),
    yMin: Math.min(...points.map((point) => point.y)),
    xMax: Math.max(...points.map((point) => point.x)),
    yMax: Math.max(...points.map((point) => point.y))
  };
}

describe("font builder", () => {
  it("uses required metrics and advance widths", () => {
    const glyphs = [
      emptyGlyph({ name: ".notdef", unicode: [] }),
      emptyGlyph({ name: "space", unicode: [32], advanceWidth: 500 })
    ];
    const ttf = createTtfObject("Test", glyphs);

    expect(ttf.head.unitsPerEm).toBe(FONT_METRICS.unitsPerEm);
    expect(ttf.head.flags).toBe(1);
    expect(ttf.hhea.ascent).toBe(850);
    expect(ttf.hhea.descent).toBe(-150);
  });

  it("generates safe PostScript names and filenames", () => {
    expect(createPostScriptName("My Handwriting")).toBe("MyHandwriting-Regular");
    expect(createPostScriptName("내 손글씨")).toBe("Fontmaker-Regular");
    expect(createDownloadFilename("My Handwriting").endsWith(".ttf")).toBe(true);
  });

  it("rejects empty font names and exports with no completed glyphs", () => {
    expect(() => buildTrueTypeFont({ familyName: " ", glyphs: [] })).toThrow();
    expect(() => buildTrueTypeFont({ familyName: "Test", glyphs: [] })).toThrow();
  });

  it("writes a non-empty TTF and reads back expected unicode glyphs", () => {
    const result = buildTrueTypeFont({
      familyName: "TestFont",
      glyphs: [{ codePoint: 65, completed: true, drawing }]
    });
    const read = readGeneratedFont(result.arrayBuffer) as {
      glyf: Array<{ unicode?: number[]; contours?: unknown[] }>;
    };
    const unicodes = read.glyf.flatMap((glyph) => glyph.unicode ?? []);

    expect(result.arrayBuffer.byteLength).toBeGreaterThan(1000);
    expect(unicodes).toContain(32);
    expect(unicodes).toContain(65);
  });

  it("writes a mixed Latin, punctuation, and Korean TTF with valid horizontal metrics", () => {
    const expectedCodePoints = [65, 66, 97, 48, 63, 0xac00, 0xac01];
    const result = buildTrueTypeFont({
      familyName: "MixedFont",
      glyphs: expectedCodePoints.map((codePoint) => ({
        codePoint,
        completed: true,
        drawing
      }))
    });
    const read = readGeneratedFont(result.arrayBuffer) as ReadTtf;
    const unicodes = read.glyf.flatMap((glyph) => glyph.unicode ?? []);
    const space = glyphByUnicode(read, 32);

    expect(result.arrayBuffer.byteLength).toBeGreaterThan(1000);
    expect(result.glyphCount).toBe(9);
    expect(read.head.flags).toBe(1);
    expect(space.advanceWidth).toBe(500);
    expect(space.contours ?? []).toHaveLength(0);
    expect(unicodes).toEqual(expect.arrayContaining([32, ...expectedCodePoints]));

    for (const codePoint of expectedCodePoints) {
      const glyph = glyphByUnicode(read, codePoint);
      const bounds = contourBounds(glyph);

      expect(glyph.advanceWidth).toBe(1000);
      expect(glyph.advanceWidth).not.toBe(0);
      expect(glyph.leftSideBearing).toBe(0);
      expect(glyph.xMin).toBe(bounds.xMin);
      expect(glyph.yMin).toBe(bounds.yMin);
      expect(glyph.xMax).toBe(bounds.xMax);
      expect(glyph.yMax).toBe(bounds.yMax);
      expect(read.head.xMin).toBeLessThanOrEqual(glyph.xMin ?? Infinity);
      expect(read.head.yMin).toBeLessThanOrEqual(glyph.yMin ?? Infinity);
      expect(read.head.xMax).toBeGreaterThanOrEqual(glyph.xMax ?? -Infinity);
      expect(read.head.yMax).toBeGreaterThanOrEqual(glyph.yMax ?? -Infinity);
    }
  });

  it("sets built glyph and global font bounds from finite contour points", () => {
    const glyphs = buildExportGlyphs([
      { codePoint: 65, completed: true, drawing },
      { codePoint: 66, completed: true, drawing }
    ]);
    const ttf = createTtfObject("Bounds", glyphs);
    const visibleGlyphs = glyphs.filter((glyph) => glyph.contours.length > 0);

    expect(glyphs[1]).toMatchObject({
      name: "space",
      xMin: 0,
      yMin: 0,
      xMax: 0,
      yMax: 0,
      contours: []
    });

    for (const glyph of visibleGlyphs) {
      const bounds = contourBounds(glyph);

      expect(glyph.xMin).toBe(bounds.xMin);
      expect(glyph.yMin).toBe(bounds.yMin);
      expect(glyph.xMax).toBe(bounds.xMax);
      expect(glyph.yMax).toBe(bounds.yMax);
    }

    expect(ttf.head.xMin).toBe(Math.min(...visibleGlyphs.map((glyph) => glyph.xMin)));
    expect(ttf.head.yMin).toBe(Math.min(...visibleGlyphs.map((glyph) => glyph.yMin)));
    expect(ttf.head.xMax).toBe(Math.max(...visibleGlyphs.map((glyph) => glyph.xMax)));
    expect(ttf.head.yMax).toBe(Math.max(...visibleGlyphs.map((glyph) => glyph.yMax)));
  });

  it("keeps existing Phase 3 backups valid", () => {
    const backup = createBackup(
      [
        {
          codePoint: 65,
          completed: true,
          drawing,
          updatedAt: 1
        }
      ],
      65
    );

    expect(validateBackup(backup).glyphs).toHaveLength(1);
  });
});
