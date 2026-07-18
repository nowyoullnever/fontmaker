import { downloadBlobFile } from "../download/downloadBlob";

export function downloadTtf(arrayBuffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([arrayBuffer], {
    type: "font/ttf"
  });

  downloadBlobFile({ blob, filename });
}
