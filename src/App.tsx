import { useEffect, useMemo, useState } from "react";
import { CategorySelector } from "./components/CategorySelector";
import { CharacterCanvasPlaceholder } from "./components/CharacterCanvasPlaceholder";
import { CharacterNavigation } from "./components/CharacterNavigation";
import {
  FONT_CHARACTERS,
  getCategoryPosition,
  getFirstGlobalIndexForCategory
} from "./data/characterSet";
import {
  getNextCharacterIndex,
  getPreviousCharacterIndex
} from "./navigation";
import type { CharacterCategoryId } from "./types/character";

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentCharacter = FONT_CHARACTERS[currentIndex];

  const categoryPosition = useMemo(
    () => getCategoryPosition(currentCharacter),
    [currentCharacter]
  );

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < FONT_CHARACTERS.length - 1;

  const movePrevious = () => {
    setCurrentIndex((index) => getPreviousCharacterIndex(index));
  };

  const moveNext = () => {
    setCurrentIndex((index) =>
      getNextCharacterIndex(index, FONT_CHARACTERS.length)
    );
  };

  const selectCategory = (categoryId: CharacterCategoryId) => {
    setCurrentIndex(getFirstGlobalIndexForCategory(categoryId));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElement(event.target)) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        movePrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">개인용 웹 폰트 빌더</p>
          <h1>폰트 만들기</h1>
        </div>
        <div className="status-panel" aria-live="polite">
          <p>
            {currentCharacter.categoryLabel} · {categoryPosition.current} /{" "}
            {categoryPosition.total}
          </p>
          <p>
            전체 · {currentCharacter.globalIndex + 1} / {FONT_CHARACTERS.length}
          </p>
        </div>
      </header>

      <CategorySelector
        activeCategoryId={currentCharacter.category}
        onSelectCategory={selectCategory}
      />

      <CharacterCanvasPlaceholder
        character={currentCharacter.character}
        categoryLabel={currentCharacter.categoryLabel}
      />

      <CharacterNavigation
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={movePrevious}
        onNext={moveNext}
      />
    </main>
  );
}

