import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlobFile } from "./downloadBlob";

describe("downloadBlobFile", () => {
  const createObjectURL = vi.fn(() => "blob:test");
  const revokeObjectURL = vi.fn();
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.useFakeTimers();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    document.body.innerHTML = "";
  });

  it("creates an object URL, appends an anchor, sets filename, clicks, removes, and revokes later", () => {
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        element.click = click;
      }
      return element;
    });

    downloadBlobFile({
      blob: new Blob(["hello"], { type: "text/plain" }),
      filename: "hello.txt",
      revokeDelayMs: 500
    });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.body.querySelector("a")).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(499);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("cleans up and schedules revoke when clicking throws", () => {
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        element.click = vi.fn(() => {
          throw new Error("click failed");
        });
      }
      return element;
    });

    expect(() =>
      downloadBlobFile({
        blob: new Blob(["hello"]),
        filename: "hello.txt",
        revokeDelayMs: 100
      })
    ).toThrow("click failed");
    expect(document.body.querySelector("a")).toBeNull();

    vi.advanceTimersByTime(100);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("rejects an empty filename", () => {
    expect(() =>
      downloadBlobFile({ blob: new Blob(["hello"]), filename: " " })
    ).toThrow("Download filename is required.");
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
