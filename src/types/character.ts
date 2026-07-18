export type CharacterCategoryId =
  | "uppercase"
  | "lowercase"
  | "numbers"
  | "punctuation"
  | "korean";

export type CharacterCategory = {
  id: CharacterCategoryId;
  label: string;
  characters: string[];
};

export type FontCharacter = {
  character: string;
  codePoint: number;
  category: CharacterCategoryId;
  categoryLabel: string;
  indexInCategory: number;
  globalIndex: number;
};

