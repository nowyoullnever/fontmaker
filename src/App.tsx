import { useEffect, useMemo, useReducer, useState } from "react";
import { CategorySelector } from "./components/CategorySelector";
import { CharacterNavigation } from "./components/CharacterNavigation";
import { DrawingToolbar } from "./components/DrawingToolbar";
import { DrawingWorkspace } from "./components/DrawingWorkspace";
import {
  FONT_CHARACTERS,
  getCategoryPosition,
  getFirstGlobalIndexForCategory
} from "./data/characterSet";
import {
  BRUSH_SIZES,
  DEFAULT_BRUSH_SIZE_ID,
  DEFAULT_TOOL,
  EMPTY_GLYPH_HISTORY
} from "./drawing/drawingTypes";
import type {
  BrushSizeId,
  DrawingStroke,
  DrawingTool
} from "./drawing/drawingTypes";
import {
  drawingReducer,
  getGlyphDrawing
} from "./drawing/drawingReducer";
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
  const [drawingState, dispatchDrawing] = useReducer(drawingReducer, {});
  const [activeTool, setActiveTool] = useState<DrawingTool>(DEFAULT_TOOL);
  const [activeBrushSizeId, setActiveBrushSizeId] =
    useState<BrushSizeId>(DEFAULT_BRUSH_SIZE_ID);
  const [isGestureActive, setIsGestureActive] = useState(false);

  const currentCharacter = FONT_CHARACTERS[currentIndex];
  const currentCodePoint = currentCharacter.codePoint;
  const currentDrawing = getGlyphDrawing(drawingState, currentCodePoint);
  const currentHistory =
    drawingState[currentCodePoint] ?? EMPTY_GLYPH_HISTORY;
  const activeBrush =
    BRUSH_SIZES.find((brushSize) => brushSize.id === activeBrushSizeId) ??
    BRUSH_SIZES[1];

  const categoryPosition = useMemo(
    () => getCategoryPosition(currentCharacter),
    [currentCharacter]
  );

  const canGoPrevious = currentIndex > 0 && !isGestureActive;
  const canGoNext =
    currentIndex < FONT_CHARACTERS.length - 1 && !isGestureActive;

  const movePrevious = () => {
    if (isGestureActive) {
      return;
    }

    setCurrentIndex((index) => getPreviousCharacterIndex(index));
  };

  const moveNext = () => {
    if (isGestureActive) {
      return;
    }

    setCurrentIndex((index) =>
      getNextCharacterIndex(index, FONT_CHARACTERS.length)
    );
  };

  const selectCategory = (categoryId: CharacterCategoryId) => {
    if (isGestureActive) {
      return;
    }

    setCurrentIndex(getFirstGlobalIndexForCategory(categoryId));
  };

  const commitStroke = (stroke: DrawingStroke) => {
    dispatchDrawing({
      type: "addStroke",
      codePoint: currentCodePoint,
      stroke
    });
  };

  const eraseStrokes = (strokeIds: string[]) => {
    dispatchDrawing({
      type: "eraseStrokes",
      codePoint: currentCodePoint,
      strokeIds
    });
  };

  const undo = () => {
    dispatchDrawing({ type: "undo", codePoint: currentCodePoint });
  };

  const redo = () => {
    dispatchDrawing({ type: "redo", codePoint: currentCodePoint });
  };

  const clearGlyph = () => {
    if (currentDrawing.strokes.length === 0) {
      return;
    }

    if (window.confirm("현재 글자에 그린 내용을 모두 지울까요?")) {
      dispatchDrawing({ type: "clearGlyph", codePoint: currentCodePoint });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElement(event.target) || isGestureActive) {
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
  }, [isGestureActive]);

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
        disabled={isGestureActive}
        onSelectCategory={selectCategory}
      />

      <DrawingWorkspace
        character={currentCharacter.character}
        categoryLabel={currentCharacter.categoryLabel}
        drawing={currentDrawing}
        tool={activeTool}
        brushWidth={activeBrush.width}
        onCommitStroke={commitStroke}
        onEraseStrokes={eraseStrokes}
        onGestureActiveChange={setIsGestureActive}
      />

      <DrawingToolbar
        activeTool={activeTool}
        activeBrushSizeId={activeBrushSizeId}
        history={currentHistory}
        onSelectTool={setActiveTool}
        onSelectBrushSize={setActiveBrushSizeId}
        onUndo={undo}
        onRedo={redo}
        onClear={clearGlyph}
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

