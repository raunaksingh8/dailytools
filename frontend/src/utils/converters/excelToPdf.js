import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'spreadsheet';

// ─── Standard A4 Dimensions (Points) ─────────────────────────────────────────
const A4_W = 595.28;
const A4_H = 841.89;

// Default margins (can be dynamically tightened for wide content)
const MARGIN_NORMAL = { left: 24, right: 24, top: 34, bottom: 28 };
const MARGIN_TIGHT  = { left: 18, right: 18, top: 32, bottom: 26 };

// Font size settings
const DEFAULT_FONT_SIZE = 9.0;
const MIN_FONT_SIZE = 7.0;

// Cell padding in points
const CELL_PAD_H = 10; // 5pt left + 5pt right
const SAFETY_PAD = 4;  // extra safety margin to prevent word wrapping on exact fits

/**
 * Accurately measures text width in points for standard Helvetica font.
 */
function measureTextWidth(str, fontSize, isBold = false) {
  if (!str) return 0;
  const s = String(str);
  let totalUnits = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      totalUnits += (code === 73 || code === 74) ? 350 : (code === 77 || code === 87) ? 900 : 680;
    } else if (code >= 97 && code <= 122) {
      totalUnits += (code === 105 || code === 108) ? 260 : (code === 109 || code === 119) ? 800 : (code === 102 || code === 116 || code === 114) ? 340 : 540;
    } else if (code >= 48 && code <= 57) {
      totalUnits += 556;
    } else if (code === 32) {
      totalUnits += 278;
    } else if (code === 95 || code === 45) {
      totalUnits += 550;
    } else {
      totalUnits += 500;
    }
  }
  const units = totalUnits / 1000;
  const boldScale = isBold ? 1.08 : 1.0;
  return units * fontSize * boldScale;
}

/**
 * Calculates the required natural column widths for a sheet at a given font size.
 */
function computeSheetColumnWidths(headerRow, bodyRows, excelCols, fontSize) {
  const headFontSize = Math.min(fontSize + 0.5, 10.0);

  return headerRow.map((headText, colIdx) => {
    // 1. Header required width (NEVER wrap short headers if possible)
    const hText = String(headText || '').trim();
    const hWidth = measureTextWidth(hText, headFontSize, true) + CELL_PAD_H + SAFETY_PAD;

    // 2. Body cells content width
    let maxContentWidth = 0;
    bodyRows.forEach((row) => {
      const cellVal = String(row[colIdx] || '').trim();
      if (!cellVal) return;
      
      if (cellVal.length > 80) {
        const sampleChunk = cellVal.substring(0, 45);
        const w = measureTextWidth(sampleChunk, fontSize, false) + CELL_PAD_H;
        if (w > maxContentWidth) maxContentWidth = w;
      } else {
        const w = measureTextWidth(cellVal, fontSize, false) + CELL_PAD_H + SAFETY_PAD;
        if (w > maxContentWidth) maxContentWidth = w;
      }
    });

    // 3. Excel !cols metadata
    let excelWidth = 0;
    if (excelCols[colIdx]) {
      const colDef = excelCols[colIdx];
      if (colDef.wch != null && colDef.wch > 0) {
        excelWidth = (colDef.wch * fontSize * 0.55) + CELL_PAD_H;
      } else if (colDef.wpx != null && colDef.wpx > 0) {
        excelWidth = (colDef.wpx * 0.75) + CELL_PAD_H;
      }
    }

    // Natural width is the maximum of header, cell content, and excel width
    const natural = Math.max(hWidth, maxContentWidth, excelWidth);

    // Apply sensible min constraint (at least 32pt) and max per-column cap (240pt)
    return Math.max(32, Math.min(240, natural));
  });
}

/**
 * Resolves the optimal orientation, margins, font size, and final column widths
 * for a worksheet.
 */
function resolveSheetLayout(headerRow, bodyRows, excelCols) {
  const numCols = headerRow.length;

  const portraitPW_Normal  = A4_W - (MARGIN_NORMAL.left + MARGIN_NORMAL.right); // 547.28 pt
  const landscapePW_Normal = A4_H - (MARGIN_NORMAL.left + MARGIN_NORMAL.right); // 793.89 pt
  const landscapePW_Tight  = A4_H - (MARGIN_TIGHT.left + MARGIN_TIGHT.right);   // 805.89 pt

  // Step 1: Check natural width at comfortable default font size (9.0pt)
  const defaultWidths = computeSheetColumnWidths(headerRow, bodyRows, excelCols, DEFAULT_FONT_SIZE);
  const totalDefault = defaultWidths.reduce((a, b) => a + b, 0);

  // If natural width comfortably fits in Portrait at default font size -> PORTRAIT
  if (totalDefault <= portraitPW_Normal) {
    const scale = portraitPW_Normal / totalDefault;
    const finalWidths = defaultWidths.map(w => w * scale);
    return {
      orientation: 'portrait',
      margin: MARGIN_NORMAL,
      fontSize: DEFAULT_FONT_SIZE,
      colWidths: finalWidths,
      printableWidth: portraitPW_Normal,
      useHorizontalBreak: false,
    };
  }

  // Step 2: Check if natural width fits in Landscape at default font size (9.0pt)
  if (totalDefault <= landscapePW_Normal) {
    const scale = landscapePW_Normal / totalDefault;
    const finalWidths = defaultWidths.map(w => w * scale);
    return {
      orientation: 'landscape',
      margin: MARGIN_NORMAL,
      fontSize: DEFAULT_FONT_SIZE,
      colWidths: finalWidths,
      printableWidth: landscapePW_Normal,
      useHorizontalBreak: false,
    };
  }

  // Step 3: Try reducing font size in Landscape down to MIN_FONT_SIZE (7.0pt)
  for (let fs = 8.5; fs >= MIN_FONT_SIZE; fs -= 0.5) {
    const rawWidths = computeSheetColumnWidths(headerRow, bodyRows, excelCols, fs);
    const sumWidths = rawWidths.reduce((a, b) => a + b, 0);

    if (sumWidths <= landscapePW_Normal) {
      const scale = landscapePW_Normal / sumWidths;
      const finalWidths = rawWidths.map(w => w * scale);
      return {
        orientation: 'landscape',
        margin: MARGIN_NORMAL,
        fontSize: fs,
        colWidths: finalWidths,
        printableWidth: landscapePW_Normal,
        useHorizontalBreak: false,
      };
    }

    if (sumWidths <= landscapePW_Tight) {
      const scale = landscapePW_Tight / sumWidths;
      const finalWidths = rawWidths.map(w => w * scale);
      return {
        orientation: 'landscape',
        margin: MARGIN_TIGHT,
        fontSize: fs,
        colWidths: finalWidths,
        printableWidth: landscapePW_Tight,
        useHorizontalBreak: false,
      };
    }
  }

  // Step 4: For moderately wide sheets (up to ~14 columns), compress slightly to fit single landscape page
  const minWidths = computeSheetColumnWidths(headerRow, bodyRows, excelCols, MIN_FONT_SIZE);
  const totalMin = minWidths.reduce((a, b) => a + b, 0);

  if (numCols <= 14 && totalMin <= landscapePW_Tight * 1.35) {
    const scale = (landscapePW_Tight - 0.5) / totalMin;
    const finalWidths = minWidths.map(w => Math.max(26, w * scale));
    const currentSum = finalWidths.reduce((a, b) => a + b, 0);
    if (currentSum > landscapePW_Tight) {
      const fixRatio = (landscapePW_Tight - 0.5) / currentSum;
      for (let i = 0; i < finalWidths.length; i++) finalWidths[i] *= fixRatio;
    }
    return {
      orientation: 'landscape',
      margin: MARGIN_TIGHT,
      fontSize: MIN_FONT_SIZE,
      colWidths: finalWidths,
      printableWidth: landscapePW_Tight,
      useHorizontalBreak: false,
    };
  }

  // Step 5: Ultra-wide sheet (15+ columns or very wide data)
  // Use horizontal pagination so NO columns are cropped and font remains completely readable!
  const readableWidths = computeSheetColumnWidths(headerRow, bodyRows, excelCols, 7.5);
  return {
    orientation: 'landscape',
    margin: MARGIN_TIGHT,
    fontSize: 7.5,
    colWidths: readableWidths,
    printableWidth: landscapePW_Tight,
    useHorizontalBreak: true,
  };
}

/**
 * Converts an Excel workbook (.xlsx/.xls) into a well-formatted, professional PDF.
 */
export async function convertExcelToPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: true });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The Excel workbook contains no readable sheets.');
  }

  let pdf = null;

  for (let sIdx = 0; sIdx < workbook.SheetNames.length; sIdx++) {
    const sheetName = workbook.SheetNames[sIdx];
    const sheet     = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
      dateNF: 'yyyy-mm-dd',
    });

    if (!rawRows || rawRows.length === 0) {
      const orientation = 'portrait';
      if (!pdf) {
        pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation });
      } else {
        pdf.addPage('a4', orientation);
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text(sheetName, MARGIN_NORMAL.left, 45);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text('(Worksheet is empty)', MARGIN_NORMAL.left, 70);
      continue;
    }

    const numCols = Math.max(...rawRows.map(r => (Array.isArray(r) ? r.length : 0)), 1);

    const normalizedRows = rawRows.map(row => {
      const arr = Array.isArray(row) ? row : [row];
      return Array.from({ length: numCols }, (_, i) =>
        arr[i] !== undefined && arr[i] !== null ? String(arr[i]).trim() : ''
      );
    });

    const excelCols = sheet['!cols'] || [];

    const hasHeader = normalizedRows.length > 1;
    const headRow   = hasHeader
      ? normalizedRows[0]
      : Array.from({ length: numCols }, (_, i) => `Col ${i + 1}`);
    const bodyRows  = hasHeader ? normalizedRows.slice(1) : normalizedRows;

    const layout = resolveSheetLayout(headRow, bodyRows, excelCols);
    const { orientation, margin, fontSize, colWidths, useHorizontalBreak } = layout;

    if (!pdf) {
      pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation });
    } else {
      pdf.addPage('a4', orientation);
    }

    const pageWidth  = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const columnStyles = {};
    colWidths.forEach((w, i) => {
      const isNumericCol = bodyRows.length > 0 && bodyRows.every(r => {
        const v = r[i];
        return !v || /^[\d,.$€£%+\-()]+$/.test(v);
      });

      columnStyles[i] = {
        cellWidth: Math.round(w * 100) / 100,
        halign: isNumericCol ? 'right' : 'left',
      };
    });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(30, 41, 59);
    pdf.text(sheetName, margin.left, 24);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `${normalizedRows.length} rows · ${numCols} cols · ${orientation.toUpperCase()}`,
      pageWidth - margin.right,
      24,
      { align: 'right' }
    );

    autoTable(pdf, {
      startY: 32,
      head: [headRow],
      body: bodyRows,
      margin: margin,
      horizontalPageBreak: useHorizontalBreak,
      horizontalPageBreakRepeat: useHorizontalBreak ? 0 : null,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      theme: 'grid',
      styles: {
        fontSize,
        font: 'helvetica',
        cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
        lineColor: [209, 213, 219],
        lineWidth: 0.4,
        textColor: [31, 41, 55],
        overflow: 'linebreak',
        minCellHeight: fontSize + 7,
      },
      headStyles: {
        fillColor: [30, 58, 95],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: Math.min(fontSize + 0.5, 10.0),
        halign: 'left',
        minCellHeight: fontSize + 9,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
      didDrawPage: (data) => {
        const pNum = data.pageNumber;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Sheet: ${sheetName}`, margin.left, pageHeight - 12);
        pdf.text(
          `Page ${pNum}`,
          pageWidth - margin.right,
          pageHeight - 12,
          { align: 'right' }
        );

        if (pNum > 1) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.setTextColor(30, 41, 59);
          pdf.text(`${sheetName} (continued)`, margin.left, 22);
        }
      },
    });
  }

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(file.name)}.pdf`,
    message: 'Excel spreadsheet converted to PDF with dynamic orientation and column-preserving layout.',
  };
}
