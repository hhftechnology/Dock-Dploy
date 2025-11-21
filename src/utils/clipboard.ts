/**
 * Copy text to clipboard
 * @param text Text to copy to clipboard
 * @returns Promise that resolves when text is copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/**
 * Download text as a file
 * @param content File content
 * @param filename Name of the file to download
 * @param mimeType MIME type of the file (default: text/plain)
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple files as separate downloads
 * @param files Array of file objects with filename and content
 */
export function downloadMultipleFiles(
  files: Array<{ filename: string; content: string; mimeType?: string }>
): void {
  files.forEach((file, index) => {
    // Stagger downloads slightly to avoid browser blocking
    setTimeout(() => {
      downloadFile(file.content, file.filename, file.mimeType);
    }, index * 100);
  });
}
