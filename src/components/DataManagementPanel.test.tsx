import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataManagementPanel } from "./DataManagementPanel";

vi.mock("../download/downloadBlob", () => ({
  downloadBlobFile: vi.fn()
}));

vi.mock("../storage/glyphRepository", () => ({
  loadAllGlyphRecords: vi.fn(async () => [])
}));

describe("DataManagementPanel", () => {
  it("uses the shared Blob download utility for backup export", async () => {
    const { downloadBlobFile } = await import("../download/downloadBlob");
    const user = userEvent.setup();

    render(
      <DataManagementPanel
        currentCodePoint={65}
        drawingState={{}}
        completedCodePoints={new Set()}
        onMessage={vi.fn()}
        onError={vi.fn()}
        onReplaceWorkspace={vi.fn()}
      />
    );

    await user.click(screen.getByText("데이터 관리"));
    await user.click(screen.getByRole("button", { name: "백업 파일 저장" }));

    expect(downloadBlobFile).toHaveBeenCalledWith({
      blob: expect.any(Blob),
      filename: expect.stringMatching(/^fontmaker-backup-\d{4}-\d{2}-\d{2}\.json$/)
    });
  });
});
