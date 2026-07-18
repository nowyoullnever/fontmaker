import { useMemo, useState } from "react";
import { getGlyphDrawing } from "../drawing/drawingReducer";
import type { GlyphDrawingMap } from "../drawing/drawingTypes";
import { FONT_CHARACTERS } from "../data/characterSet";
import {
  buildTrueTypeFont,
  HORIZONTAL_METRICS_ERROR
} from "../font/fontBuilder";
import { downloadTtf } from "../font/downloadFont";
import type { ExportableGlyphRecord } from "../font/fontTypes";
import { drawingHasValidDrawablePoints } from "../font/glyphBuilder";

type FontExportPanelProps = {
  drawingState: GlyphDrawingMap;
  completedCodePoints: Set<number>;
  disabled?: boolean;
};

function getExportableGlyphRecords(
  drawingState: GlyphDrawingMap,
  completedCodePoints: Set<number>
): ExportableGlyphRecord[] {
  return FONT_CHARACTERS.map((character) => ({
    codePoint: character.codePoint,
    drawing: getGlyphDrawing(drawingState, character.codePoint),
    completed: completedCodePoints.has(character.codePoint)
  }));
}

function countValidCompletedGlyphs(records: ExportableGlyphRecord[]): number {
  return records.filter(
    (record) =>
      record.completed &&
      record.drawing.strokes.length > 0 &&
      drawingHasValidDrawablePoints(record.drawing)
  ).length;
}

export function FontExportPanel({
  drawingState,
  completedCodePoints,
  disabled = false
}: FontExportPanelProps) {
  const [fontName, setFontName] = useState("내 손글씨");
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const exportableRecords = useMemo(
    () => getExportableGlyphRecords(drawingState, completedCodePoints),
    [drawingState, completedCodePoints]
  );
  const validCompletedCount = useMemo(
    () => countValidCompletedGlyphs(exportableRecords),
    [exportableRecords]
  );
  const isFontNameEmpty = fontName.trim().length === 0;
  const canExport =
    !disabled && !isExporting && !isFontNameEmpty && validCompletedCount > 0;

  const exportFont = () => {
    if (!canExport) {
      setStatus(
        isFontNameEmpty
          ? "폰트 이름을 입력해 주세요."
          : "완료된 글자가 없습니다."
      );
      return;
    }

    try {
      setIsExporting(true);
      setStatus("폰트를 만드는 중...");
      const result = buildTrueTypeFont({
        familyName: fontName,
        glyphs: exportableRecords
      });
      downloadTtf(result.arrayBuffer, result.filename);
      setStatus("폰트를 만들었습니다.");
    } catch (error) {
      console.error(error);
      setStatus("폰트를 만들지 못했습니다.");
      if (error instanceof Error && error.message === HORIZONTAL_METRICS_ERROR) {
        setStatus(error.message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="font-export-panel" aria-label="폰트 만들기">
      <h2>폰트 만들기</h2>
      <label className="font-name-field">
        <span>폰트 이름</span>
        <input
          required
          value={fontName}
          onChange={(event) => setFontName(event.target.value)}
          disabled={isExporting}
        />
      </label>
      <p className="export-summary">
        포함할 글자: {validCompletedCount}개
        <br />
        미완성 글자는 포함하지 않습니다.
      </p>
      <button
        type="button"
        className="secondary-button"
        onClick={exportFont}
        disabled={!canExport}
      >
        TTF 파일 만들기
      </button>
      {status ? (
        <p className="export-status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </section>
  );
}
