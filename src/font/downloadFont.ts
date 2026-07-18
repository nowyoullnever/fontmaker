export function downloadTtf(arrayBuffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([arrayBuffer], {
    type: "font/ttf"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

