import { isKnownCodePoint } from "../management/characterManagement";
import type { BuiltGlyph } from "./fontTypes";

export function validateFontName(fontName: string): void {
  if (fontName.trim().length === 0) {
    throw new Error("폰트 이름을 입력해 주세요.");
  }
}

export function validateBuiltGlyphs(glyphs: BuiltGlyph[]): void {
  if (glyphs.length < 3) {
    throw new Error("완료된 글자가 없습니다.");
  }

  if (glyphs[0]?.name !== ".notdef") {
    throw new Error(".notdef glyph missing");
  }

  if (glyphs[1]?.name !== "space" || glyphs[1].unicode[0] !== 32) {
    throw new Error("space glyph missing");
  }

  const unicodeValues = new Set<number>();
  const glyphNames = new Set<string>();

  for (const glyph of glyphs) {
    if (glyph.advanceWidth <= 0) {
      throw new Error("invalid advance width");
    }

    if (glyphNames.has(glyph.name)) {
      throw new Error("duplicate glyph name");
    }
    glyphNames.add(glyph.name);

    for (const unicode of glyph.unicode) {
      if (unicode !== 32 && !isKnownCodePoint(unicode)) {
        throw new Error("unknown code point");
      }

      if (unicodeValues.has(unicode)) {
        throw new Error("duplicate unicode");
      }
      unicodeValues.add(unicode);
    }

    for (const contour of glyph.contours) {
      if (contour.length < 3) {
        throw new Error("invalid contour");
      }

      for (const point of contour) {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
          throw new Error("invalid contour point");
        }
      }
    }
  }
}

