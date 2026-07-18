import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabaseConnectionForTests } from "./database";
import {
  loadWorkspaceSettings,
  saveWorkspaceSettings
} from "./settingsRepository";

async function resetFakeDatabase() {
  resetDatabaseConnectionForTests();
  await indexedDB.deleteDatabase("fontmaker");
}

describe("settings repository", () => {
  beforeEach(async () => {
    await resetFakeDatabase();
  });

  it("restores the last active character setting", async () => {
    await saveWorkspaceSettings({
      lastCodePoint: 44032,
      selectedTool: "eraser",
      selectedBrushSize: "thick"
    });

    expect(await loadWorkspaceSettings()).toEqual({
      lastCodePoint: 44032,
      selectedTool: "eraser",
      selectedBrushSize: "thick"
    });
  });
});

