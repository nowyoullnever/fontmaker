import type { GlyphDrawing } from "../drawing/drawingTypes";
import { openFontmakerDatabase } from "./database";
import type { StoredGlyphRecord } from "./storageTypes";

export function hasMeaningfulGlyphState(
  drawing: GlyphDrawing,
  completed: boolean
): boolean {
  return drawing.strokes.length > 0 || completed;
}

export async function loadAllGlyphRecords(): Promise<StoredGlyphRecord[]> {
  const database = await openFontmakerDatabase();
  return database.getAll("glyphs");
}

export async function saveGlyphRecord(record: StoredGlyphRecord): Promise<void> {
  const database = await openFontmakerDatabase();

  if (!hasMeaningfulGlyphState(record.drawing, record.completed)) {
    await database.delete("glyphs", record.codePoint);
    return;
  }

  await database.put("glyphs", record);
}

export async function deleteGlyphRecord(codePoint: number): Promise<void> {
  const database = await openFontmakerDatabase();
  await database.delete("glyphs", codePoint);
}

export async function replaceAllGlyphRecords(
  records: StoredGlyphRecord[]
): Promise<void> {
  const database = await openFontmakerDatabase();
  const transaction = database.transaction("glyphs", "readwrite");
  await transaction.store.clear();

  for (const record of records) {
    if (hasMeaningfulGlyphState(record.drawing, record.completed)) {
      await transaction.store.put(record);
    }
  }

  await transaction.done;
}

