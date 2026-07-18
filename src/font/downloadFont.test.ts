import { describe, expect, it, vi } from "vitest";

vi.mock("../download/downloadBlob", () => ({
  downloadBlobFile: vi.fn()
}));

describe("downloadTtf", () => {
  it("uses the shared Blob download utility", async () => {
    const { downloadBlobFile } = await import("../download/downloadBlob");
    const { downloadTtf } = await import("./downloadFont");

    downloadTtf(new ArrayBuffer(8), "test.ttf");

    expect(downloadBlobFile).toHaveBeenCalledWith({
      blob: expect.any(Blob),
      filename: "test.ttf"
    });
  });
});

