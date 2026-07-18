import { KOREAN_CHARACTERS } from "./koreanCharacters";
import {
  LOWERCASE_CHARACTERS,
  NUMBER_CHARACTERS,
  UPPERCASE_CHARACTERS
} from "./latinCharacters";
import { PUNCTUATION_CHARACTERS } from "./punctuationCharacters";
import type {
  CharacterCategory,
  CharacterCategoryId,
  FontCharacter
} from "../types/character";

export const CHARACTER_CATEGORY_ORDER: CharacterCategoryId[] = [
  "uppercase",
  "lowercase",
  "numbers",
  "punctuation",
  "korean"
];

export const CHARACTER_CATEGORIES: CharacterCategory[] = [
  {
    id: "uppercase",
    label: "대문자",
    characters: UPPERCASE_CHARACTERS
  },
  {
    id: "lowercase",
    label: "소문자",
    characters: LOWERCASE_CHARACTERS
  },
  {
    id: "numbers",
    label: "숫자",
    characters: NUMBER_CHARACTERS
  },
  {
    id: "punctuation",
    label: "특수문자",
    characters: [...PUNCTUATION_CHARACTERS]
  },
  {
    id: "korean",
    label: "한글",
    characters: KOREAN_CHARACTERS
  }
];

export const FONT_CHARACTERS: FontCharacter[] = CHARACTER_CATEGORIES.flatMap(
  (category) =>
    category.characters.map((character, indexInCategory) => {
      const codePoint = character.codePointAt(0);

      if (codePoint === undefined) {
        throw new Error(`빈 문자는 사용할 수 없습니다: ${category.id}`);
      }

      return {
        character,
        codePoint,
        category: category.id,
        categoryLabel: category.label,
        indexInCategory,
        globalIndex: 0
      };
    })
).map((character, globalIndex) => ({
  ...character,
  globalIndex
}));

export function getCategoryById(
  categoryId: CharacterCategoryId
): CharacterCategory {
  const category = CHARACTER_CATEGORIES.find((item) => item.id === categoryId);

  if (!category) {
    throw new Error(`알 수 없는 문자 범주입니다: ${categoryId}`);
  }

  return category;
}

export function getFirstGlobalIndexForCategory(
  categoryId: CharacterCategoryId
): number {
  const character = FONT_CHARACTERS.find((item) => item.category === categoryId);

  if (!character) {
    throw new Error(`비어 있는 문자 범주입니다: ${categoryId}`);
  }

  return character.globalIndex;
}

export function getCategoryPosition(character: FontCharacter): {
  current: number;
  total: number;
} {
  const category = getCategoryById(character.category);

  return {
    current: character.indexInCategory + 1,
    total: category.characters.length
  };
}

