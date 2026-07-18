import { describe, expect, it } from "vitest";
import {
  CHARACTER_CATEGORY_ORDER,
  FONT_CHARACTERS
} from "./characterSet";
import { KOREAN_CHARACTERS, validateKoreanCharacters } from "./koreanCharacters";
import {
  LOWERCASE_CHARACTERS,
  NUMBER_CHARACTERS,
  UPPERCASE_CHARACTERS
} from "./latinCharacters";
import { PUNCTUATION_CHARACTERS } from "./punctuationCharacters";

const REQUIRED_PUNCTUATION = [
  "!",
  "\"",
  "#",
  "$",
  "%",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ".",
  "/",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  "[",
  "\\",
  "]",
  "^",
  "_",
  "`",
  "{",
  "|",
  "}",
  "~"
];

describe("character data", () => {
  it("contains exactly 26 uppercase characters", () => {
    expect(UPPERCASE_CHARACTERS).toHaveLength(26);
  });

  it("contains exactly 26 lowercase characters", () => {
    expect(LOWERCASE_CHARACTERS).toHaveLength(26);
  });

  it("contains exactly 10 number characters", () => {
    expect(NUMBER_CHARACTERS).toHaveLength(10);
  });

  it("matches the exact punctuation array and order", () => {
    expect(PUNCTUATION_CHARACTERS).toEqual(REQUIRED_PUNCTUATION);
  });

  it("parses the Korean source into a non-empty character array", () => {
    expect(KOREAN_CHARACTERS.length).toBeGreaterThan(0);
  });

  it("stores every Korean entry as exactly one Unicode code point", () => {
    for (const character of KOREAN_CHARACTERS) {
      expect(Array.from(character)).toHaveLength(1);
    }
  });

  it("keeps every Korean character in the Hangul syllable range", () => {
    for (const character of KOREAN_CHARACTERS) {
      const codePoint = character.codePointAt(0);

      expect(codePoint).toBeGreaterThanOrEqual(0xac00);
      expect(codePoint).toBeLessThanOrEqual(0xd7a3);
    }
  });

  it("reports validation without mutating Korean source data", () => {
    const result = validateKoreanCharacters();

    expect(result.whitespaceRemaining).toBe(false);
    expect(result.invalidCharacters).toEqual([]);
    expect(result.emptyEntries).toBe(0);
  });

  it("uses the required combined category order", () => {
    expect(CHARACTER_CATEGORY_ORDER).toEqual([
      "uppercase",
      "lowercase",
      "numbers",
      "punctuation",
      "korean"
    ]);

    expect([...new Set(FONT_CHARACTERS.map((item) => item.category))]).toEqual(
      CHARACTER_CATEGORY_ORDER
    );
  });

  it("assigns continuous globalIndex values beginning at zero", () => {
    FONT_CHARACTERS.forEach((character, index) => {
      expect(character.globalIndex).toBe(index);
    });
  });
});

