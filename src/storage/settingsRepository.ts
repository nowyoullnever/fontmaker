import { openFontmakerDatabase } from "./database";
import type { StoredWorkspaceSettings } from "./storageTypes";

const SETTINGS_KEY = "workspace";

export async function loadWorkspaceSettings(): Promise<
  StoredWorkspaceSettings | undefined
> {
  const database = await openFontmakerDatabase();
  return database.get("settings", SETTINGS_KEY);
}

export async function saveWorkspaceSettings(
  settings: StoredWorkspaceSettings
): Promise<void> {
  const database = await openFontmakerDatabase();
  await database.put("settings", settings, SETTINGS_KEY);
}

