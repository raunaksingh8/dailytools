import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'spreadsheet';

/**
 * Parses a numeric value from a string if applicable.
 */
function parseCellValue(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return { t: 's', v: '' };

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const num = Number(text);
    if (!Number.isNaN(num)) return { t: 'n', v: num };
  }

  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) {
    const clean = text.replace(/,/g, '');
    const num = Number(clean);
    if (!Number.isNaN(num)) return { t: 'n', v: num, z: '#,##0.00' };
  }

  const currencyMatch = text.match(/^([$€£¥])\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?)$/);
  if (currencyMatch) {
    const symbol = currencyMatch[1];
    const clean = currencyMatch[2].replace(/,/g, '');
    const num = Number(clean);
    if (!Number.isNaN(num)) {
      const format = symbol === '$' ? '$#,##0.00' : `${symbol}#,##0.00`;
      return { t: 'n', v: num, z: format };
    }
  }

  const percentMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*%$/);
  if (percentMatch) {
    const num = Number(percentMatch[1]);
    if (!Number.isNaN(num)) return { t: 'n', v: num / 100, z: '0.0%' };
  }

  return { t: 's', v: text };
}

/**
 * Extracts visual lines from a PDF page and merges adjacent sub-words/phrases.
 */
function extractLines(items, height) {
  const sorted = items
    .filter((i) => i.str && i.str.trim())
    .map((i) => {
      const fontSize = Math.max(6, Math.hypot(i.transform[2], i.transform[3]) || i.height || 10);
      return {
        text: i.str.trim(),
        x: i.transform[4],
        y: i.transform[5],
        top: height - i.transform[5],
        w: i.width || 0,
        fontSize,
      };
    })
    .sort((a, b) => a.top - b.top || a.x - b.x);

  const lineGroups = [];
  sorted.forEach((item) => {
    const tol = Math.max(3, item.fontSize * 0.4);
    const existing = lineGroups.find((lg) => Math.abs(lg.top - item.top) <= tol);
    if (existing) {
      existing.items.push(item);
      const n = existing.items.length;
      existing.top = (existing.top * (n - 1) + item.top) / n;
    } else {
      lineGroups.push({ top: item.top, items: [item] });
    }
  });

  return lineGroups.map((lg) => {
    lg.items.sort((a, b) => a.x - b.x);
    const merged = [];
    lg.items.forEach((it) => {
      if (merged.length === 0) {
        merged.push({ ...it });
      } else {
        const prev = merged[merged.length - 1];
        const prevEnd = prev.x + prev.w;
        const gap = it.x - prevEnd;
        // Merge if items are practically touching or separated by normal intra-word space
        if (gap < Math.max(4, prev.fontSize * 0.35)) {
          prev.text += ' ' + it.text;
          prev.w = it.x + it.w - prev.x;
        } else {
          merged.push({ ...it });
        }
      }
    });
    return {
      top: lg.top,
      items: merged,
      text: merged.map((i) => i.text).join(' ').trim(),
      fontSize: Math.max(...merged.map((i) => i.fontSize)),
    };
  });
}

/**
 * Returns true if a line represents document/page metadata rather than tabular data.
 */
function isPageMetadata(text) {
  const t = text.trim();
  if (!t) return true;
  if (/query\s+result/i.test(t)) return true;
  if (/\d+\s+rows?\s*[·•\s]+\d+\s+cols?/i.test(t)) return true;
  if (/sheet\s*:/i.test(t)) return true;
  if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(t)) return true;
  if (/^\d+$/i.test(t)) return true;
  if (/^(confidential|all rights reserved|printed on:.*)$/i.test(t)) return true;
  return false;
}

/**
 * Checks if a line matches a known master column model (repeated page header).
 */
function isMatchingHeader(line, colModel) {
  if (!colModel || colModel.length === 0) return false;
  const labels = colModel.map((c) => c.label.toLowerCase());
  const lineTexts = line.items.map((i) => i.text.toLowerCase());
  let matches = 0;
  labels.forEach((l) => {
    if (lineTexts.some((lt) => lt === l || lt.includes(l) || l.includes(lt))) {
      matches++;
    }
  });
  return matches >= Math.ceil(labels.length * 0.5);
}

/**
 * Builds the master column model from a header line.
 */
function buildColumnModel(headerLine) {
  const cols = headerLine.items.map((i) => ({
    label: i.text,
    startX: i.x,
    endX: i.x + i.w,
  }));

  const boundaries = [];
  for (let i = 0; i < cols.length; i++) {
    if (i === cols.length - 1) {
      boundaries.push({ ...cols[i], rightBoundary: Infinity });
    } else {
      const curRight = cols[i].endX;
      const nextLeft = cols[i + 1].startX;
      const cut = nextLeft > curRight ? (curRight + nextLeft) / 2 : nextLeft - 4;
      boundaries.push({ ...cols[i], rightBoundary: cut });
    }
  }
  return boundaries;
}

/**
 * Maps items on a visual line into specific columns based on header geometry.
 */
function mapLineToRow(items, colModel) {
  const row = Array(colModel.length).fill('');
  items.forEach((it) => {
    let colIdx = colModel.length - 1;
    for (let c = 0; c < colModel.length; c++) {
      if (it.x < colModel[c].rightBoundary) {
        colIdx = c;
        break;
      }
    }
    if (row[colIdx]) {
      row[colIdx] += ' ' + it.text;
    } else {
      row[colIdx] = it.text;
    }
  });
  return row;
}

/**
 * Converts a PDF document to an Excel workbook (.xlsx).
 */
export async function convertPdfToExcel(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const workbook = XLSX.utils.book_new();

  let masterColModel = null;
  const allDataRows = [];
  let prevLine = null;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const lines = extractLines(content.items, vp.height);

    for (const line of lines) {
      if (isPageMetadata(line.text)) {
        continue;
      }

      if (!masterColModel) {
        // Table header detection: line with 2 or more distinct columns
        if (line.items.length >= 2) {
          masterColModel = buildColumnModel(line);
          prevLine = line;
          continue;
        }
      } else {
        // Check if this line is a repeated page header
        if (isMatchingHeader(line, masterColModel)) {
          prevLine = line;
          continue;
        }
      }

      if (masterColModel) {
        const rawRow = mapLineToRow(line.items, masterColModel);
        const filledCols = rawRow.map((val, idx) => (val.trim() ? idx : -1)).filter((idx) => idx !== -1);

        // Check if this line is a multi-line wrapped text continuation of previous row
        const lineGap = prevLine ? line.top - prevLine.top : Infinity;
        const isContinuation =
          filledCols.length === 1 &&
          allDataRows.length > 0 &&
          prevLine !== null &&
          lineGap < line.fontSize * 1.25;

        if (isContinuation) {
          const lastRow = allDataRows[allDataRows.length - 1];
          const targetCol = filledCols[0];
          const prevVal = String(lastRow[targetCol]?.v || '').trim();
          if (prevVal) {
            lastRow[targetCol] = parseCellValue(`${prevVal} ${rawRow[targetCol]}`.trim());
            prevLine = line;
            continue;
          }
        }

        // Add valid data row (even if trailing columns are blank)
        const parsedRow = rawRow.map(parseCellValue);
        if (parsedRow.some((c) => c.v !== '')) {
          allDataRows.push(parsedRow);
        }
        prevLine = line;
      }
    }
  }

  // ── Build the single output worksheet ─────────────────────────────────────
  if (!masterColModel || allDataRows.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([
      [{ t: 's', v: 'Notice: No selectable text or structured tables found (likely a scanned image).' }],
      [{ t: 's', v: 'OCR (Optical Character Recognition) is not supported in the browser.' }],
    ]);
    ws['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, ws, 'Converted Data');
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return {
      blob: new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      fileName: `${fileStem(file.name)}.xlsx`,
      message: 'Notice: No selectable text was found in the document (OCR is not supported in browser).',
    };
  }

  const numCols = masterColModel.length;
  const headerRow = masterColModel.map((col) => parseCellValue(col.label));
  const allRows = [headerRow, ...allDataRows];

  const maxCols = Math.max(...allRows.map((r) => r.length), numCols);
  const ws = {};
  const range = { s: { c: 0, r: 0 }, e: { c: maxCols - 1, r: allRows.length - 1 } };

  allRows.forEach((row, rIdx) => {
    for (let cIdx = 0; cIdx < maxCols; cIdx++) {
      const cellRef = XLSX.utils.encode_cell({ c: cIdx, r: rIdx });
      ws[cellRef] = row[cIdx] || { t: 's', v: '' };
    }
  });

  ws['!ref'] = XLSX.utils.encode_range(range);

  // Auto column widths
  const colWidths = Array(maxCols).fill(10);
  allRows.forEach((row) => {
    row.forEach((cell, ci) => {
      const strLen = String(cell.v || '').length;
      if (strLen > colWidths[ci]) colWidths[ci] = Math.min(50, strLen + 3);
    });
  });
  ws['!cols'] = colWidths.map((w) => ({ wch: Math.max(10, w) }));

  XLSX.utils.book_append_sheet(workbook, ws, 'Converted Data');

  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return {
    blob: new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    fileName: `${fileStem(file.name)}.xlsx`,
    message: 'PDF converted to Excel with structured table extraction in a single consolidated worksheet.',
  };
}
