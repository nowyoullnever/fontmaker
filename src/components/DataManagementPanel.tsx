import { downloadBlobFile } from "../download/downloadBlob";
import { getGlyphDrawing } from "../drawing/drawingReducer";
import type { GlyphDrawingMap } from "../drawing/drawingTypes";
import {
  buildBackupFilename,
  createBackup,
  parseBackupJson
} from "../storage/backup";
import { loadAllGlyphRecords } from "../storage/glyphRepository";
import type { StoredGlyphRecord } from "../storage/storageTypes";

type DataManagementPanelProps = {
  currentCodePoint: number;
  drawingState: GlyphDrawingMap;
  completedCodePoints: Set<number>;
  onMessage: (message: string | null) => void;
  onError: (message: string | null) => void;
  onReplaceWorkspace: (
    records: StoredGlyphRecord[],
    lastCodePoint: number
  ) => Promise<void>;
  onClearAllWork: () => void | Promise<void>;
};

function buildRecordsFromMemory(
  drawingState: GlyphDrawingMap,
  completedCodePoints: Set<number>
): StoredGlyphRecord[] {
  const codePoints = new Set([
    ...Object.keys(drawingState).map(Number),
    ...completedCodePoints
  ]);

  return Array.from(codePoints)
    .map((codePoint) => {
      const drawing = getGlyphDrawing(drawingState, codePoint);
      const completed =
        completedCodePoints.has(codePoint) && drawing.strokes.length > 0;

      return {
        codePoint,
        drawing,
        completed,
        updatedAt: Date.now()
      };
    })
    .filter((record) => record.drawing.strokes.length > 0 || record.completed);
}

export function DataManagementPanel({
  currentCodePoint,
  drawingState,
  completedCodePoints,
  onMessage,
  onError,
  onReplaceWorkspace,
  onClearAllWork
}: DataManagementPanelProps) {
  const exportBackup = async () => {
    try {
      const persistedRecords = await loadAllGlyphRecords();
      const memoryRecords = buildRecordsFromMemory(
        drawingState,
        completedCodePoints
      );
      const recordMap = new Map<number, StoredGlyphRecord>();
      persistedRecords.forEach((record) => recordMap.set(record.codePoint, record));
      memoryRecords.forEach((record) => recordMap.set(record.codePoint, record));
      const backup = createBackup(Array.from(recordMap.values()), currentCodePoint);
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json"
      });

      downloadBlobFile({ blob, filename: buildBackupFilename() });
      onMessage("백업 파일을 만들었습니다.");
    } catch (error) {
      console.error(error);
      onError("백업 파일을 만들지 못했습니다.");
    }
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const backup = parseBackupJson(text);

      if (
        !window.confirm(
          "현재 저장된 작업을 백업 파일의 내용으로 바꿀까요?"
        )
      ) {
        return;
      }

      await onReplaceWorkspace(backup.glyphs, backup.lastCodePoint);
      onMessage("백업 파일을 불러왔습니다.");
    } catch {
      onError("올바른 백업 파일이 아닙니다.");
    }
  };

  return (
    <details className="data-management">
      <summary>데이터 관리</summary>
      <div className="toolbar-row">
        <button type="button" className="secondary-button" onClick={exportBackup}>
          백업 파일 저장
        </button>
        <label className="file-import-button">
          백업 파일 불러오기
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              void importBackup(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button
          type="button"
          className="secondary-button danger-button"
          onClick={() => void onClearAllWork()}
        >
          그린 폰트 모두 지우기
        </button>
      </div>
    </details>
  );
}
