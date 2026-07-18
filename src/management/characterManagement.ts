import {
  CHARACTER_CATEGORIES,
  FONT_CHARACTERS,
  getCategoryById
} from "../data/characterSet";
import type { CharacterCategoryId, FontCharacter } from "../types/character";

export type CharacterListCategoryFilter = CharacterCategoryId | "all";
export type CompletionFilter = "all" | "incomplete" | "completed";

export const CHARACTER_LIST_PAGE_SIZE = 120;

export function getKnownCodePointSet(): Set<number> {
  return new Set(FONT_CHARACTERS.map((character) => character.codePoint));
}

export function isKnownCodePoint(codePoint: number): boolean {
  return FONT_CHARACTERS.some((character) => character.codePoint === codePoint);
}

export function findGlobalIndexByCodePoint(codePoint: number): number {
  return FONT_CHARACTERS.findIndex((character) => character.codePoint === codePoint);
}

export function findNextIncompleteIndex(
  currentGlobalIndex: number,
  completedCodePoints: Set<number>
): number | null {
  for (
    let index = currentGlobalIndex + 1;
    index < FONT_CHARACTERS.length;
    index += 1
  ) {
    if (!completedCodePoints.has(FONT_CHARACTERS[index].codePoint)) {
      return index;
    }
  }

  return null;
}

export function getOverallCompletedCount(completedCodePoints: Set<number>): number {
  return FONT_CHARACTERS.filter((character) =>
    completedCodePoints.has(character.codePoint)
  ).length;
}

export function getCategoryCompletedCount(
  categoryId: CharacterCategoryId,
  completedCodePoints: Set<number>
): number {
  return getCategoryById(categoryId).characters.filter((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && completedCodePoints.has(codePoint);
  }).length;
}

export function filterCharactersForList(
  characters: FontCharacter[],
  categoryFilter: CharacterListCategoryFilter,
  completionFilter: CompletionFilter,
  completedCodePoints: Set<number>
): FontCharacter[] {
  return characters.filter((character) => {
    const categoryMatches =
      categoryFilter === "all" || character.category === categoryFilter;
    const isCompleted = completedCodePoints.has(character.codePoint);
    const completionMatches =
      completionFilter === "all" ||
      (completionFilter === "completed" && isCompleted) ||
      (completionFilter === "incomplete" && !isCompleted);

    return categoryMatches && completionMatches;
  });
}

export function paginateCharacters(
  characters: FontCharacter[],
  page: number,
  pageSize = CHARACTER_LIST_PAGE_SIZE
): {
  items: FontCharacter[];
  currentPage: number;
  totalPages: number;
} {
  const totalPages = Math.max(1, Math.ceil(characters.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: characters.slice(start, start + pageSize),
    currentPage,
    totalPages
  };
}

export type CharacterSearchResult =
  | { status: "empty" }
  | { status: "found"; character: FontCharacter }
  | { status: "multiple" }
  | { status: "unknown" };

export function searchExactCharacter(input: string): CharacterSearchResult {
  const characters = Array.from(input.trim());

  if (characters.length === 0) {
    return { status: "empty" };
  }

  if (characters.length > 1) {
    return { status: "multiple" };
  }

  const codePoint = characters[0].codePointAt(0);
  const found = FONT_CHARACTERS.find(
    (character) => character.codePoint === codePoint
  );

  return found ? { status: "found", character: found } : { status: "unknown" };
}

export const CHARACTER_LIST_CATEGORIES = [
  { id: "all", label: "전체" },
  ...CHARACTER_CATEGORIES
] as const;

