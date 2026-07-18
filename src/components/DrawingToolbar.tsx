import type {
  BrushSizeId,
  DrawingTool,
  GlyphDrawingHistory
} from "../drawing/drawingTypes";
import { BRUSH_SIZES } from "../drawing/drawingTypes";

type DrawingToolbarProps = {
  activeTool: DrawingTool;
  activeBrushSizeId: BrushSizeId;
  history: GlyphDrawingHistory;
  isCompleted: boolean;
  hasStrokes: boolean;
  saveStatus: "idle" | "saving" | "saved" | "failed";
  onSelectTool: (tool: DrawingTool) => void;
  onSelectBrushSize: (brushSizeId: BrushSizeId) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onToggleCompletion: () => void;
};

export function DrawingToolbar({
  activeTool,
  activeBrushSizeId,
  history,
  isCompleted,
  hasStrokes,
  saveStatus,
  onSelectTool,
  onSelectBrushSize,
  onUndo,
  onRedo,
  onClear,
  onToggleCompletion
}: DrawingToolbarProps) {
  const activeBrush = BRUSH_SIZES.find((size) => size.id === activeBrushSizeId);
  const toolLabel = activeTool === "pen" ? "펜" : "지우개";
  const saveStatusLabel =
    saveStatus === "saving"
      ? "저장 중..."
      : saveStatus === "saved"
        ? "저장됨"
        : saveStatus === "failed"
          ? "저장 실패"
          : "";

  return (
    <section className="drawing-toolbar" aria-label="그리기 도구">
      <p className="tool-status" aria-live="polite">
        현재 도구: {toolLabel} · 굵기: {activeBrush?.label ?? "보통"}
      </p>

      <div className="toolbar-row" role="group" aria-label="도구 선택">
        <button
          type="button"
          className="tool-button"
          aria-pressed={activeTool === "pen"}
          onClick={() => onSelectTool("pen")}
        >
          펜
        </button>
        <button
          type="button"
          className="tool-button"
          aria-pressed={activeTool === "eraser"}
          onClick={() => onSelectTool("eraser")}
        >
          지우개
        </button>
      </div>

      <div className="toolbar-row" role="group" aria-label="펜 굵기">
        {BRUSH_SIZES.map((brushSize) => (
          <button
            key={brushSize.id}
            type="button"
            className="tool-button"
            aria-pressed={brushSize.id === activeBrushSizeId}
            onClick={() => onSelectBrushSize(brushSize.id)}
          >
            {brushSize.label}
          </button>
        ))}
      </div>

      <div className="toolbar-row" role="group" aria-label="그리기 작업">
        <button
          type="button"
          className="tool-button complete-button"
          onClick={onToggleCompletion}
          disabled={!hasStrokes}
          aria-pressed={isCompleted}
        >
          {isCompleted ? "완료 취소" : "완료"}
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={onUndo}
          disabled={history.undoStack.length === 0}
        >
          실행 취소
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={onRedo}
          disabled={history.redoStack.length === 0}
        >
          다시 실행
        </button>
        <button
          type="button"
          className="tool-button danger-button"
          onClick={onClear}
          disabled={!hasStrokes}
        >
          전체 지우기
        </button>
      </div>

      <p className="session-notice">
        그림은 이 브라우저에 자동으로 저장됩니다.
      </p>
      {saveStatusLabel ? (
        <p className="save-status" aria-live="polite">
          {saveStatusLabel}
        </p>
      ) : null}
    </section>
  );
}
