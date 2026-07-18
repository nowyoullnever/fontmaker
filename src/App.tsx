import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CategorySelector } from "./components/CategorySelector";
import { CharacterListDialog } from "./components/CharacterListDialog";
import { CharacterNavigation } from "./components/CharacterNavigation";
import { DataManagementPanel } from "./components/DataManagementPanel";
import { DrawingToolbar } from "./components/DrawingToolbar";
import { DrawingWorkspace } from "./components/DrawingWorkspace";
import { FontExportPanel } from "./components/FontExportPanel";
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
  DrawingTool,
  GlyphDrawing
} from "./drawing/drawingTypes";
import {
  drawingReducer,
  getGlyphDrawing
} from "./drawing/drawingReducer";
import {
  findGlobalIndexByCodePoint,
  findNextIncompleteIndex,
  getCategoryCompletedCount,
  getOverallCompletedCount,
  isKnownCodePoint
} from "./management/characterManagement";
import {
  getNextCharacterIndex,
  getPreviousCharacterIndex
} from "./navigation";
import {
  deleteGlyphRecord,
  loadAllGlyphRecords,
  replaceAllGlyphRecords,
  saveGlyphRecord
} from "./storage/glyphRepository";
import {
  loadWorkspaceSettings,
  saveWorkspaceSettings
} from "./storage/settingsRepository";
import type { StoredGlyphRecord } from "./storage/storageTypes";
import type { CharacterCategoryId } from "./types/character";

type SaveStatus = "idle" | "saving" | "saved" | "failed";

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

function buildCompletedSet(records: StoredGlyphRecord[]): Set<number> {
  return new Set(
    records
      .filter((record) => record.completed && record.drawing.strokes.length > 0)
      .map((record) => record.codePoint)
  );
}

function buildDrawingHydration(
  records: StoredGlyphRecord[]
): Record<number, GlyphDrawing> {
  return Object.fromEntries(
    records.map((record) => [record.codePoint, record.drawing])
  );
}

export function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawingState, dispatchDrawing] = useReducer(drawingReducer, {});
  const [completedCodePoints, setCompletedCodePoints] = useState<Set<number>>(
    () => new Set()
  );
  const [activeTool, setActiveTool] = useState<DrawingTool>(DEFAULT_TOOL);
  const [activeBrushSizeId, setActiveBrushSizeId] =
    useState<BrushSizeId>(DEFAULT_BRUSH_SIZE_ID);
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isCharacterListOpen, setIsCharacterListOpen] = useState(false);
  const listButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveQueueRef = useRef(Promise.resolve());
  const currentCharacter = FONT_CHARACTERS[currentIndex];
  const currentCodePoint = currentCharacter.codePoint;
  const currentDrawing = getGlyphDrawing(drawingState, currentCodePoint);
  const currentHistory =
    drawingState[currentCodePoint] ?? EMPTY_GLYPH_HISTORY;
  const activeBrush =
    BRUSH_SIZES.find((brushSize) => brushSize.id === activeBrushSizeId) ??
    BRUSH_SIZES[1];
  const isCurrentCompleted = completedCodePoints.has(currentCodePoint);

  const categoryPosition = useMemo(
    () => getCategoryPosition(currentCharacter),
    [currentCharacter]
  );

  const overallCompletedCount = useMemo(
    () => getOverallCompletedCount(completedCodePoints),
    [completedCodePoints]
  );
  const categoryCompletedCount = useMemo(
    () =>
      getCategoryCompletedCount(currentCharacter.category, completedCodePoints),
    [completedCodePoints, currentCharacter.category]
  );
  const nextIncompleteIndex = useMemo(
    () => findNextIncompleteIndex(currentIndex, completedCodePoints),
    [currentIndex, completedCodePoints]
  );

  const canNavigate = !isGestureActive && !isLoading;
  const canGoPrevious = currentIndex > 0 && canNavigate;
  const canGoNext = currentIndex < FONT_CHARACTERS.length - 1 && canNavigate;

  const queueSave = (operation: () => Promise<void>) => {
    setSaveStatus("saving");
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(operation)
      .then(() => {
        setSaveStatus("saved");
      })
      .catch(() => {
        setSaveStatus("failed");
        setStorageError(
          "저장에 실패했습니다. 현재 작업은 화면에는 남아 있지만 브라우저에 저장되지 않았을 수 있습니다."
        );
      });
  };

  const persistGlyph = (
    codePoint: number,
    drawing: GlyphDrawing,
    completed: boolean
  ) => {
    queueSave(async () => {
      if (drawing.strokes.length === 0 && !completed) {
        await deleteGlyphRecord(codePoint);
        return;
      }

      await saveGlyphRecord({
        codePoint,
        drawing,
        completed,
        updatedAt: Date.now()
      });
    });
  };

  const persistSettings = (
    codePoint: number,
    selectedTool = activeTool,
    selectedBrushSize = activeBrushSizeId
  ) => {
    queueSave(() =>
      saveWorkspaceSettings({
        lastCodePoint: codePoint,
        selectedTool,
        selectedBrushSize
      })
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function restoreSavedState() {
      try {
        const [records, settings] = await Promise.all([
          loadAllGlyphRecords(),
          loadWorkspaceSettings()
        ]);

        if (!isMounted) {
          return;
        }

        dispatchDrawing({
          type: "hydrate",
          drawingsByCodePoint: buildDrawingHydration(records)
        });
        setCompletedCodePoints(buildCompletedSet(records));

        if (
          settings?.lastCodePoint !== undefined &&
          isKnownCodePoint(settings.lastCodePoint)
        ) {
          setCurrentIndex(findGlobalIndexByCodePoint(settings.lastCodePoint));
        }

        if (settings?.selectedTool) {
          setActiveTool(settings.selectedTool);
        }

        if (settings?.selectedBrushSize) {
          setActiveBrushSizeId(settings.selectedBrushSize);
        }
      } catch {
        if (isMounted) {
          setStorageError(
            "저장된 작업을 불러오지 못했습니다. 현재 작업은 이 브라우저에 저장되지 않을 수 있습니다."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSavedState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      persistSettings(currentCodePoint);
    }
  }, [currentCodePoint]);

  const moveToIndex = (nextIndex: number) => {
    if (!canNavigate) {
      return;
    }

    setCurrentIndex(nextIndex);
  };

  const movePrevious = () => {
    moveToIndex(getPreviousCharacterIndex(currentIndex));
  };

  const moveNext = () => {
    moveToIndex(getNextCharacterIndex(currentIndex, FONT_CHARACTERS.length));
  };

  const selectCategory = (categoryId: CharacterCategoryId) => {
    moveToIndex(getFirstGlobalIndexForCategory(categoryId));
  };

  const moveNextIncomplete = () => {
    if (nextIncompleteIndex === null) {
      setMessage("다음 미완성 글자가 없습니다.");
      return;
    }

    moveToIndex(nextIncompleteIndex);
  };

  const commitStroke = (stroke: DrawingStroke) => {
    const nextDrawing = {
      strokes: [...currentDrawing.strokes, stroke]
    };
    dispatchDrawing({
      type: "addStroke",
      codePoint: currentCodePoint,
      stroke
    });
    persistGlyph(currentCodePoint, nextDrawing, isCurrentCompleted);
  };

  const eraseStrokes = (strokeIds: string[]) => {
    const strokeIdSet = new Set(strokeIds);
    const nextDrawing = {
      strokes: currentDrawing.strokes.filter(
        (stroke) => !strokeIdSet.has(stroke.id)
      )
    };
    const nextCompleted = nextDrawing.strokes.length > 0 && isCurrentCompleted;

    dispatchDrawing({
      type: "eraseStrokes",
      codePoint: currentCodePoint,
      strokeIds
    });

    if (!nextCompleted && isCurrentCompleted) {
      setCompletedCodePoints((current) => {
        const next = new Set(current);
        next.delete(currentCodePoint);
        return next;
      });
    }

    persistGlyph(currentCodePoint, nextDrawing, nextCompleted);
  };

  const undo = () => {
    if (currentHistory.undoStack.length === 0) {
      return;
    }

    const nextDrawing = currentHistory.undoStack[currentHistory.undoStack.length - 1];
    dispatchDrawing({ type: "undo", codePoint: currentCodePoint });
    persistGlyph(currentCodePoint, nextDrawing, isCurrentCompleted);
  };

  const redo = () => {
    if (currentHistory.redoStack.length === 0) {
      return;
    }

    const nextDrawing = currentHistory.redoStack[0];
    dispatchDrawing({ type: "redo", codePoint: currentCodePoint });
    persistGlyph(currentCodePoint, nextDrawing, isCurrentCompleted);
  };

  const clearGlyph = () => {
    if (currentDrawing.strokes.length === 0) {
      return;
    }

    if (window.confirm("현재 글자에 그린 내용을 모두 지울까요?")) {
      dispatchDrawing({ type: "clearGlyph", codePoint: currentCodePoint });
      setCompletedCodePoints((current) => {
        const next = new Set(current);
        next.delete(currentCodePoint);
        return next;
      });
      persistGlyph(currentCodePoint, { strokes: [] }, false);
    }
  };

  const toggleCompletion = () => {
    if (currentDrawing.strokes.length === 0) {
      return;
    }

    const nextCompleted = !isCurrentCompleted;
    setCompletedCodePoints((current) => {
      const next = new Set(current);

      if (nextCompleted) {
        next.add(currentCodePoint);
      } else {
        next.delete(currentCodePoint);
      }

      return next;
    });
    persistGlyph(currentCodePoint, currentDrawing, nextCompleted);
  };

  const selectTool = (tool: DrawingTool) => {
    setActiveTool(tool);
    persistSettings(currentCodePoint, tool, activeBrushSizeId);
  };

  const selectBrushSize = (brushSizeId: BrushSizeId) => {
    setActiveBrushSizeId(brushSizeId);
    persistSettings(currentCodePoint, activeTool, brushSizeId);
  };

  const replaceWorkspace = async (
    records: StoredGlyphRecord[],
    lastCodePoint: number
  ) => {
    await replaceAllGlyphRecords(records);
    await saveWorkspaceSettings({
      lastCodePoint,
      selectedTool: activeTool,
      selectedBrushSize: activeBrushSizeId
    });
    dispatchDrawing({
      type: "hydrate",
      drawingsByCodePoint: buildDrawingHydration(records)
    });
    setCompletedCodePoints(buildCompletedSet(records));
    setCurrentIndex(findGlobalIndexByCodePoint(lastCodePoint));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElement(event.target) || !canNavigate) {
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
  }, [canNavigate, currentIndex]);

  if (isLoading) {
    return (
      <main className="app-shell app-loading">
        <p>저장된 작업을 불러오는 중...</p>
      </main>
    );
  }

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
          <p>
            전체 완료: {overallCompletedCount} / {FONT_CHARACTERS.length}
          </p>
          <p>
            {currentCharacter.categoryLabel} 완료: {categoryCompletedCount} /{" "}
            {categoryPosition.total}
          </p>
        </div>
      </header>

      {storageError ? <p className="inline-error">{storageError}</p> : null}
      {message ? <p className="inline-message">{message}</p> : null}

      <CategorySelector
        activeCategoryId={currentCharacter.category}
        disabled={!canNavigate}
        onSelectCategory={selectCategory}
      />

      <div className="quick-actions">
        <button
          ref={listButtonRef}
          type="button"
          className="secondary-button"
          onClick={() => setIsCharacterListOpen(true)}
        >
          글자 목록
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={moveNextIncomplete}
          disabled={nextIncompleteIndex === null || !canNavigate}
        >
          다음 미완성
        </button>
      </div>

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
        isCompleted={isCurrentCompleted}
        hasStrokes={currentDrawing.strokes.length > 0}
        saveStatus={saveStatus}
        onSelectTool={selectTool}
        onSelectBrushSize={selectBrushSize}
        onUndo={undo}
        onRedo={redo}
        onClear={clearGlyph}
        onToggleCompletion={toggleCompletion}
      />

      <CharacterNavigation
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={movePrevious}
        onNext={moveNext}
      />

      <DataManagementPanel
        currentCodePoint={currentCodePoint}
        drawingState={drawingState}
        completedCodePoints={completedCodePoints}
        onMessage={setMessage}
        onError={setStorageError}
        onReplaceWorkspace={replaceWorkspace}
      />

      <FontExportPanel
        drawingState={drawingState}
        completedCodePoints={completedCodePoints}
        disabled={isLoading || isGestureActive}
      />

      {isCharacterListOpen ? (
        <CharacterListDialog
          activeCodePoint={currentCodePoint}
          completedCodePoints={completedCodePoints}
          onClose={() => {
            setIsCharacterListOpen(false);
            listButtonRef.current?.focus();
          }}
          onSelectCharacter={(globalIndex) => {
            setIsCharacterListOpen(false);
            moveToIndex(globalIndex);
            listButtonRef.current?.focus();
          }}
        />
      ) : null}
    </main>
  );
}
