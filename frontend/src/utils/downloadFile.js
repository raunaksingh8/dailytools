/**
 * DailyTools — shared download utility
 *
 * Usage:
 *   import { downloadFile, downloadBlob } from '../../utils/downloadFile';
 *
 *   downloadFile('hello world', 'output.txt', 'text/plain');
 *   downloadBlob(myBlob, 'merged.pdf');
 */

/**
 * Download a text string as a file.
 * Returns false (and does NOT create a file) when content is empty/whitespace-only.
 *
 * @param {string} content    - The text content to save.
 * @param {string} filename   - The suggested filename including extension.
 * @param {string} mimeType   - MIME type, e.g. 'application/json'.
 * @returns {boolean}         - true if the download was triggered, false if skipped.
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  if (!content || !content.trim()) return false;

  const blob = new Blob([content], { type: mimeType });
  return downloadBlob(blob, filename);
}

/**
 * Download a Blob/File object as a file.
 * Returns false when blob is empty.
 *
 * @param {Blob} blob
 * @param {string} filename
 * @returns {boolean}
 */
export function downloadBlob(blob, filename) {
  if (!blob || blob.size === 0) return false;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay so iOS Safari has time to open the download
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}
