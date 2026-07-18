import type { CharacterCategoryId } from "../types/character";
import { CHARACTER_CATEGORIES } from "../data/characterSet";

type CategorySelectorProps = {
  activeCategoryId: CharacterCategoryId;
  disabled?: boolean;
  onSelectCategory: (categoryId: CharacterCategoryId) => void;
};

export function CategorySelector({
  activeCategoryId,
  disabled = false,
  onSelectCategory
}: CategorySelectorProps) {
  return (
    <nav className="category-selector" aria-label="문자 범주">
      {CHARACTER_CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          className="category-button"
          aria-pressed={category.id === activeCategoryId}
          disabled={disabled}
          onClick={() => onSelectCategory(category.id)}
        >
          {category.label}
        </button>
      ))}
    </nav>
  );
}

