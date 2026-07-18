import * as fonteditorCore from "fonteditor-core";
import { buildExportGlyphs } from "./glyphBuilder";
import { validateBuiltGlyphs, validateFontName } from "./fontValidation";
import {
  FONT_METRICS,
  type BuiltGlyph,
  type FontBuildInput,
  type FontBuildResult
} from "./fontTypes";

const { TTFReader, TTFWriter } = fonteditorCore as unknown as {
  TTFReader: new (options?: Record<string, unknown>) => {
    read: (buffer: ArrayBuffer) => unknown;
  };
  TTFWriter: new (options?: Record<string, unknown>) => {
    write: (ttfObject: unknown) => ArrayBuffer;
  };
};

export const HORIZONTAL_METRICS_ERROR =
  "?고듃??湲??媛꾧꺽 ?뺣낫瑜?留뚮뱾吏 紐삵뻽?듬땲??";

type FonteditorGlyph = {
  name: string;
  unicode: number[];
  advanceWidth: number;
  leftSideBearing: number;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  contours: Array<Array<{ x: number; y: number; onCurve: true }>>;
};

type ReadGlyph = {
  unicode?: number[];
  advanceWidth?: number;
  leftSideBearing?: number;
  xMin?: number;
  yMin?: number;
  xMax?: number;
  yMax?: number;
  contours?: unknown[];
};

type ReadTtfObject = {
  head?: {
    flags?: number;
    xMin?: number;
    yMin?: number;
    xMax?: number;
    yMax?: number;
  };
  glyf?: ReadGlyph[];
};

export function createPostScriptName(familyName: string): string {
  const ascii = familyName
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]+/g, "")
    .slice(0, 48);

  return `${ascii || "Fontmaker"}-Regular`;
}

export function createDownloadFilename(familyName: string): string {
  return `${createPostScriptName(familyName)}.ttf`;
}

function glyphToFonteditorGlyph(glyph: BuiltGlyph): FonteditorGlyph {
  return {
    name: glyph.name,
    unicode: glyph.unicode,
    advanceWidth: glyph.advanceWidth,
    leftSideBearing: glyph.leftSideBearing,
    xMin: glyph.xMin,
    yMin: glyph.yMin,
    xMax: glyph.xMax,
    yMax: glyph.yMax,
    contours: glyph.contours
  };
}

function calculateGlobalBounds(glyphs: BuiltGlyph[]): Pick<
  BuiltGlyph,
  "xMin" | "yMin" | "xMax" | "yMax"
> {
  const visibleGlyphs = glyphs.filter((glyph) => glyph.contours.length > 0);

  if (visibleGlyphs.length === 0) {
    return { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
  }

  return visibleGlyphs.reduce(
    (bounds, glyph) => ({
      xMin: Math.min(bounds.xMin, glyph.xMin),
      yMin: Math.min(bounds.yMin, glyph.yMin),
      xMax: Math.max(bounds.xMax, glyph.xMax),
      yMax: Math.max(bounds.yMax, glyph.yMax)
    }),
    {
      xMin: visibleGlyphs[0].xMin,
      yMin: visibleGlyphs[0].yMin,
      xMax: visibleGlyphs[0].xMax,
      yMax: visibleGlyphs[0].yMax
    }
  );
}

export function createTtfObject(familyName: string, glyphs: BuiltGlyph[]) {
  const postScriptName = createPostScriptName(familyName);
  const visibleFamilyName = familyName.trim();
  const globalBounds = calculateGlobalBounds(glyphs);

  return {
    version: 1,
    head: {
      version: 1,
      fontRevision: 1,
      checkSumAdjustment: 0,
      magicNumber: 0x5f0f3cf5,
      flags: 1,
      unitsPerEm: FONT_METRICS.unitsPerEm,
      created: 0,
      modified: 0,
      xMin: globalBounds.xMin,
      yMin: globalBounds.yMin,
      xMax: globalBounds.xMax,
      yMax: globalBounds.yMax,
      macStyle: 0,
      lowestRecPPEM: 8,
      fontDirectionHint: 2,
      indexToLocFormat: 0,
      glyphDataFormat: 0
    },
    hhea: {
      version: 1,
      ascent: FONT_METRICS.ascender,
      descent: FONT_METRICS.descender,
      lineGap: 0,
      advanceWidthMax: FONT_METRICS.defaultAdvanceWidth,
      minLeftSideBearing: 0,
      minRightSideBearing: 0,
      xMaxExtent: FONT_METRICS.defaultAdvanceWidth,
      caretSlopeRise: 1,
      caretSlopeRun: 0,
      caretOffset: 0,
      reserved0: 0,
      reserved1: 0,
      reserved2: 0,
      reserved3: 0,
      metricDataFormat: 0,
      numOfLongHorMetrics: glyphs.length
    },
    maxp: { version: 1, numGlyphs: glyphs.length },
    name: {
      fontFamily: visibleFamilyName,
      fontSubFamily: "Regular",
      uniqueSubFamily: `${visibleFamilyName} Regular`,
      fullName: `${visibleFamilyName} Regular`,
      version: "Version 1.0",
      postScriptName
    },
    "OS/2": {
      version: 3,
      xAvgCharWidth: FONT_METRICS.defaultAdvanceWidth,
      usWeightClass: 400,
      usWidthClass: 5,
      fsType: 0,
      ySubscriptXSize: 650,
      ySubscriptYSize: 699,
      ySubscriptXOffset: 0,
      ySubscriptYOffset: 140,
      ySuperscriptXSize: 650,
      ySuperscriptYSize: 699,
      ySuperscriptXOffset: 0,
      ySuperscriptYOffset: 479,
      yStrikeoutSize: 49,
      yStrikeoutPosition: 258,
      sFamilyClass: 0,
      bFamilyType: 0,
      bSerifStyle: 0,
      bWeight: 0,
      bProportion: 0,
      bContrast: 0,
      bStrokeVariation: 0,
      bArmStyle: 0,
      bLetterform: 0,
      bMidline: 0,
      bXHeight: 0,
      ulUnicodeRange1: 1,
      ulUnicodeRange2: 0,
      ulUnicodeRange3: 0,
      ulUnicodeRange4: 0,
      achVendID: "FMKR",
      fsSelection: 0x40,
      usFirstCharIndex: 32,
      usLastCharIndex: 0xd7a3,
      sTypoAscender: FONT_METRICS.ascender,
      sTypoDescender: FONT_METRICS.descender,
      sTypoLineGap: 0,
      usWinAscent: FONT_METRICS.ascender,
      usWinDescent: Math.abs(FONT_METRICS.descender),
      ulCodePageRange1: 1,
      ulCodePageRange2: 0,
      sxHeight: 0,
      sCapHeight: 700,
      usDefaultChar: 0,
      usBreakChar: 32,
      usMaxContext: 0
    },
    post: {
      format: 3,
      italicAngle: 0,
      underlinePosition: -75,
      underlineThickness: 50,
      isFixedPitch: 1,
      minMemType42: 0,
      maxMemType42: 0,
      minMemType1: 0,
      maxMemType1: 0
    },
    glyf: glyphs.map(glyphToFonteditorGlyph)
  };
}

function isFiniteMetric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateGeneratedHorizontalMetrics(
  read: ReadTtfObject,
  expectedGlyphs: BuiltGlyph[]
): void {
  const readGlyphs = read.glyf;

  if (!Array.isArray(readGlyphs) || readGlyphs.length < expectedGlyphs.length) {
    throw new Error(HORIZONTAL_METRICS_ERROR);
  }

  const readByUnicode = new Map<number, ReadGlyph>();

  for (const glyph of readGlyphs) {
    for (const unicode of glyph.unicode ?? []) {
      readByUnicode.set(unicode, glyph);
    }

    if (!isFiniteMetric(glyph.leftSideBearing)) {
      throw new Error(HORIZONTAL_METRICS_ERROR);
    }

    if ((glyph.contours?.length ?? 0) > 0) {
      if (
        !isFiniteMetric(glyph.xMin) ||
        !isFiniteMetric(glyph.yMin) ||
        !isFiniteMetric(glyph.xMax) ||
        !isFiniteMetric(glyph.yMax) ||
        glyph.xMin > glyph.xMax ||
        glyph.yMin > glyph.yMax
      ) {
        throw new Error(HORIZONTAL_METRICS_ERROR);
      }
    }
  }

  const notdefGlyph = readGlyphs[0];
  const spaceGlyph = readByUnicode.get(32);

  if (
    notdefGlyph.advanceWidth !== FONT_METRICS.defaultAdvanceWidth ||
    spaceGlyph?.advanceWidth !== FONT_METRICS.spaceAdvanceWidth
  ) {
    throw new Error(HORIZONTAL_METRICS_ERROR);
  }

  for (const expectedGlyph of expectedGlyphs) {
    for (const unicode of expectedGlyph.unicode) {
      const readGlyph = readByUnicode.get(unicode);

      if (!readGlyph) {
        throw new Error(HORIZONTAL_METRICS_ERROR);
      }

      if (
        unicode !== 32 &&
        (!isFiniteMetric(readGlyph.advanceWidth) ||
          readGlyph.advanceWidth !== FONT_METRICS.defaultAdvanceWidth ||
          readGlyph.advanceWidth <= 0)
      ) {
        throw new Error(HORIZONTAL_METRICS_ERROR);
      }
    }
  }
}

export function buildTrueTypeFont(input: FontBuildInput): FontBuildResult {
  validateFontName(input.familyName);
  const glyphs = buildExportGlyphs(input.glyphs);
  validateBuiltGlyphs(glyphs);

  const writer = new TTFWriter({});
  const arrayBuffer = writer.write(createTtfObject(input.familyName, glyphs));

  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength === 0) {
    throw new Error("TTF 파일을 만들지 못했습니다.");
  }

  validateGeneratedHorizontalMetrics(
    readGeneratedFont(arrayBuffer) as ReadTtfObject,
    glyphs
  );

  return {
    arrayBuffer,
    filename: createDownloadFilename(input.familyName),
    glyphCount: glyphs.length,
    exportedCodePoints: glyphs.flatMap((glyph) => glyph.unicode)
  };
}

export function readGeneratedFont(arrayBuffer: ArrayBuffer) {
  return new TTFReader({}).read(arrayBuffer);
}
