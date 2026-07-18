import { describe, expect, it } from "vitest";
import { createBackup } from "../storage/backup";
import { validateBackup } from "../storage/backup";
import { FONT_METRICS } from "./fontTypes";
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

describe("font builder", () => {
  it("uses required metrics and advance widths", () => {
    const glyphs = [
      { name: ".notdef", unicode: [], advanceWidth: 1000, leftSideBearing: 0, contours: [] },
      { name: "space", unicode: [32], advanceWidth: 500, leftSideBearing: 0, contours: [] }
    ];
    const ttf = createTtfObject("Test", glyphs);

    expect(ttf.head.unitsPerEm).toBe(FONT_METRICS.unitsPerEm);
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

  it("writes a mixed Latin, punctuation, and Korean TTF", () => {
    const result = buildTrueTypeFont({
      familyName: "MixedFont",
      glyphs: [65, 97, 48, 63, 0xac00].map((codePoint) => ({
        codePoint,
        completed: true,
        drawing
      }))
    });
    const read = readGeneratedFont(result.arrayBuffer) as {
      glyf: Array<{ unicode?: number[] }>;
    };
    const unicodes = read.glyf.flatMap((glyph) => glyph.unicode ?? []);

    expect(result.arrayBuffer.byteLength).toBeGreaterThan(1000);
    expect(result.glyphCount).toBe(7);
    expect(unicodes).toEqual(expect.arrayContaining([32, 48, 63, 65, 97, 0xac00]));
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
