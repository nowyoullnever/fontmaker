import { describe, expect, it } from "vitest";
import { FONT_CHARACTERS } from "./data/characterSet";
import {
  getNextCharacterIndex,
  getPreviousCharacterIndex
} from "./navigation";

describe("character navigation", () => {
  it("cannot move before the first character", () => {
    expect(getPreviousCharacterIndex(0)).toBe(0);
  });

  it("cannot move beyond the final character", () => {
    const finalIndex = FONT_CHARACTERS.length - 1;

    expect(getNextCharacterIndex(finalIndex, FONT_CHARACTERS.length)).toBe(
      finalIndex
    );
  });
});

