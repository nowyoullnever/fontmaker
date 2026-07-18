export type DownloadBlobOptions = {
  blob: Blob;
  filename: string;
  revokeDelayMs?: number;
};

const DEFAULT_REVOKE_DELAY_MS = 1000;

export function downloadBlobFile({
  blob,
  filename,
  revokeDelayMs = DEFAULT_REVOKE_DELAY_MS
}: DownloadBlobOptions): void {
  if (filename.trim().length === 0) {
    throw new Error("Download filename is required.");
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  try {
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs);
  }
}

