import { beforeEach, describe, expect, it } from "vitest";
import type { StoredGlyphRecord } from "./storageTypes";
import {
  loadAllGlyphRecords,
  replaceAllGlyphRecords,
  saveGlyphRecord
} from "./glyphRepository";
import { resetDatabaseConnectionForTests } from "./database";

const recordA: StoredGlyphRecord = {
  codePoint: 65,
  completed: true,
  updatedAt: 1,
  drawing: {
    strokes: [
      {
        id: "a",
        width: 0.025,
        points: [{ x: 0.1, y: 0.1, pressure: 0.65, timestamp: 1 }]
      }
    ]
  }
};

const recordB: StoredGlyphRecord = {
  ...recordA,
  codePoint: 66,
  completed: false,
  drawing: {
    strokes: [
      {
        id: "b",
        width: 0.045,
        points: [{ x: 0.2, y: 0.2, pressure: 0.65, timestamp: 2 }]
      }
    ]
  }
};

async function resetFakeDatabase() {
  resetDatabaseConnectionForTests();
  await indexedDB.deleteDatabase("fontmaker");
}

describe("glyph repository", () => {
  beforeEach(async () => {
    await resetFakeDatabase();
  });

  it("saves and loads a stored glyph record", async () => {
    await saveGlyphRecord(recordA);

    expect(await loadAllGlyphRecords()).toEqual([recordA]);
  });

  it("keeps different code points independent in storage", async () => {
    await saveGlyphRecord(recordA);
    await saveGlyphRecord(recordB);

    expect((await loadAllGlyphRecords()).map((record) => record.codePoint).sort()).toEqual([
      65,
      66
    ]);
  });

  it("removes an empty incomplete glyph from storage", async () => {
    await saveGlyphRecord(recordA);
    await saveGlyphRecord({
      codePoint: 65,
      completed: false,
      updatedAt: 2,
      drawing: { strokes: [] }
    });

    expect(await loadAllGlyphRecords()).toEqual([]);
  });

  it("successful replacement import replaces old records completely", async () => {
    await saveGlyphRecord(recordA);
    await replaceAllGlyphRecords([recordB]);

    expect(await loadAllGlyphRecords()).toEqual([recordB]);
  });
});

