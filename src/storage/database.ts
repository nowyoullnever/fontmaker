import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { StoredGlyphRecord, StoredWorkspaceSettings } from "./storageTypes";

type FontmakerDB = DBSchema & {
  glyphs: {
    key: number;
    value: StoredGlyphRecord;
  };
  settings: {
    key: string;
    value: StoredWorkspaceSettings;
  };
};

const DB_NAME = "fontmaker";
const DB_VERSION = 1;

let databasePromise: Promise<IDBPDatabase<FontmakerDB>> | null = null;

export function openFontmakerDatabase(): Promise<IDBPDatabase<FontmakerDB>> {
  databasePromise ??= openDB<FontmakerDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("glyphs")) {
        database.createObjectStore("glyphs", { keyPath: "codePoint" });
      }

      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings");
      }
    }
  });

  return databasePromise;
}

export function resetDatabaseConnectionForTests(): void {
  if (databasePromise) {
    void databasePromise.then((database) => database.close());
  }
  databasePromise = null;
}
