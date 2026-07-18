import { describe, expect, it } from "vitest";
import {
  BACKUP_SCHEMA_VERSION,
  CHARACTER_SET_VERSION,
  type StoredGlyphRecord
} from "./storageTypes";
import { createBackup, validateBackup } from "./backup";

const validRecord: StoredGlyphRecord = {
  codePoint: 65,
  completed: true,
  updatedAt: 1,
  drawing: {
    strokes: [
      {
        id: "a",
        width: 0.025,
        points: [{ x: 0.5, y: 0.5, pressure: 0.65, timestamp: 1 }]
      }
    ]
  }
};

describe("backup", () => {
  it("exports required schema fields", () => {
    expect(createBackup([validRecord], 65, new Date("2026-07-18T00:00:00Z"))).toEqual({
      schemaVersion: BACKUP_SCHEMA_VERSION,
      characterSetVersion: CHARACTER_SET_VERSION,
      exportedAt: "2026-07-18T00:00:00.000Z",
      lastCodePoint: 65,
      glyphs: [validRecord]
    });
  });

  it("accepts a valid backup", () => {
    const backup = createBackup([validRecord], 65);

    expect(validateBackup(backup).glyphs).toEqual([validRecord]);
  });

  it("rejects an unknown code point", () => {
    const backup = createBackup([{ ...validRecord, codePoint: 999999 }], 65);

    expect(() => validateBackup(backup)).toThrow("unknown code point");
  });

  it("rejects invalid normalized coordinates", () => {
    const backup = createBackup(
      [
        {
          ...validRecord,
          drawing: {
            strokes: [
              {
                ...validRecord.drawing.strokes[0],
                points: [{ x: 1.5, y: 0.5, pressure: 0.65, timestamp: 1 }]
              }
            ]
          }
        }
      ],
      65
    );

    expect(() => validateBackup(backup)).toThrow("invalid drawing");
  });

  it("rejects unsupported schema versions", () => {
    expect(() =>
      validateBackup({ ...createBackup([validRecord], 65), schemaVersion: 2 })
    ).toThrow("unsupported schema version");
  });
});

