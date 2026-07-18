import { DrawingCanvas } from "./DrawingCanvas";
import type {
  DrawingStroke,
  DrawingTool,
  GlyphDrawing
} from "../drawing/drawingTypes";

type DrawingWorkspaceProps = {
  character: string;
  categoryLabel: string;
  drawing: GlyphDrawing;
  tool: DrawingTool;
  brushWidth: number;
  onCommitStroke: (stroke: DrawingStroke) => void;
  onEraseStrokes: (strokeIds: string[]) => void;
  onGestureActiveChange: (isActive: boolean) => void;
};

export function DrawingWorkspace({
  character,
  categoryLabel,
  drawing,
  tool,
  brushWidth,
  onCommitStroke,
  onEraseStrokes,
  onGestureActiveChange
}: DrawingWorkspaceProps) {
  return (
    <section
      className="workspace drawing-workspace"
      aria-label={`${categoryLabel} ${character} 글자 연습 영역`}
    >
      <div className="guide-line guide-line-horizontal" aria-hidden="true" />
      <div className="guide-line guide-line-vertical" aria-hidden="true" />
      <span className="workspace-character" aria-hidden="true">
        {character}
      </span>
      <DrawingCanvas
        drawing={drawing}
        tool={tool}
        brushWidth={brushWidth}
        character={character}
        categoryLabel={categoryLabel}
        onCommitStroke={onCommitStroke}
        onEraseStrokes={onEraseStrokes}
        onGestureActiveChange={onGestureActiveChange}
      />
    </section>
  );
}

