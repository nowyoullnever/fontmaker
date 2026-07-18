import { describe, expect, it } from "vitest";
import { CHARACTER_CATEGORIES, FONT_CHARACTERS } from "../data/characterSet";
import {
  CHARACTER_LIST_PAGE_SIZE,
  filterCharactersForList,
  findGlobalIndexByCodePoint,
  findNextIncompleteIndex,
  getCategoryCompletedCount,
  getOverallCompletedCount,
  paginateCharacters,
  searchExactCharacter
} from "./characterManagement";

describe("character management", () => {
  it("calculates overall completed count", () => {
    expect(getOverallCompletedCount(new Set([65, 66]))).toBe(2);
  });

  it("calculates category completed count", () => {
    expect(getCategoryCompletedCount("uppercase", new Set([65, 66, 97]))).toBe(2);
  });

  it("finds next incomplete across category boundaries", () => {
    const completed = new Set(FONT_CHARACTERS.slice(0, 26).map((item) => item.codePoint));

    expect(findNextIncompleteIndex(24, completed)).toBe(26);
  });

  it("does not wrap when finding next incomplete", () => {
    const completed = new Set(FONT_CHARACTERS.map((item) => item.codePoint));

    expect(findNextIncompleteIndex(FONT_CHARACTERS.length - 2, completed)).toBeNull();
  });

  it("search accepts one known character", () => {
    expect(searchExactCharacter(" A ")).toEqual({
      status: "found",
      character: FONT_CHARACTERS[findGlobalIndexByCodePoint(65)]
    });
  });

  it("search rejects multiple characters", () => {
    expect(searchExactCharacter("AB")).toEqual({ status: "multiple" });
  });

  it("search rejects unknown characters", () => {
    expect(searchExactCharacter("😀")).toEqual({ status: "unknown" });
  });

  it("filters completed glyphs", () => {
    const filtered = filterCharactersForList(
      FONT_CHARACTERS.slice(0, 3),
      "all",
      "completed",
      new Set([65])
    );

    expect(filtered.map((item) => item.character)).toEqual(["A"]);
  });

  it("filters incomplete glyphs", () => {
    const filtered = filterCharactersForList(
      FONT_CHARACTERS.slice(0, 3),
      "all",
      "incomplete",
      new Set([65])
    );

    expect(filtered.map((item) => item.character)).toEqual(["B", "C"]);
  });

  it("pagination does not exceed the selected page size", () => {
    expect(paginateCharacters(FONT_CHARACTERS, 1).items).toHaveLength(
      CHARACTER_LIST_PAGE_SIZE
    );
  });

  it("keeps existing character counts unchanged", () => {
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

