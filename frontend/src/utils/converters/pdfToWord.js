import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'document';
const PDF_POINT_TO_TWIP = 20;
const SUBSET_FONT_PREFIX = /^[A-Z]{6}\+/;
const ICON_FONT_RE = /fontawesome|webdings|wingdings|symbol/i;

/**
 * pdf2docx Inspired Parameters:
 * - max_line_spacing_ratio: 1.5
 * - line_break_width_ratio: 0.5
 * - line_break_free_space_ratio: 0.15
 * - new_paragraph_free_space_ratio: 0.85
 * - lines_left_aligned_threshold: 3.0 (pt)
 * - lines_right_aligned_threshold: 3.0 (pt)
 * - lines_center_aligned_threshold: 4.0 (pt)
 * - page_margin_factor_top: 0.5
 * - page_margin_factor_bottom: 0.5
 */
const SETTINGS = {
  maxLineSpacingRatio: 1.5,
  lineBreakWidthRatio: 0.5,
  lineBreakFreeSpaceRatio: 0.15,
  newParagraphFreeSpaceRatio: 0.85,
  linesLeftAlignedThreshold: 3.0,
  linesRightAlignedThreshold: 3.0,
  linesCenterAlignedThreshold: 4.0,
  pageMarginFactorTop: 0.5,
  pageMarginFactorBottom: 0.5,
};

/**
 * Normalizes font names to standard Word-supported fonts.
 */
const normalizeFontName = (fontName, textSample = '') => {
  if (!fontName) return 'Arial';
  const clean = (fontName || '').replace(SUBSET_FONT_PREFIX, '');

  if (ICON_FONT_RE.test(clean)) return 'Arial';
  if (/consolas|courier|mono|typewriter/i.test(clean)) return 'Consolas';
  if (/times|georgia|roman|serif/i.test(clean)) return 'Times New Roman';
  if (/calibri/i.test(clean)) return 'Calibri';
  if (/arial|helvetica|sans/i.test(clean)) return 'Arial';

  // If internal PDF font identifier (e.g. g_d0_f1, g_d1_f3, f1, tt1)
  if (/^g_d\d+_f\d+$/i.test(clean) || /^f\d+$/i.test(clean) || /^[a-z]{1,2}\d+$/i.test(clean)) {
    if (/[{}[\]":]/.test(textSample) && (textSample.includes('"') || textSample.includes('{') || textSample.includes('}'))) {
      return 'Consolas';
    }
    return 'Arial';
  }

  return clean
    .replace(/-(Bold|Italic|BoldItalic|BoldOblique|Oblique|Regular|Roman|MT|PSMT)$/i, '')
    .replace(/(BoldItalic|Bold|Italic|MT|PSMT)$/i, '') || 'Arial';
};

const getFontProps = (page, fontKey, textSample = '') => {
  let sourceName = fontKey || '';
  try {
    sourceName = page.commonObjs?.get?.(fontKey)?.name || fontKey || '';
  } catch (_) { /* ignore */ }

  const norm = normalizeFontName(sourceName, textSample);
  const isBold = /bold|black|demi|heavy/i.test(sourceName) || /_f2$/i.test(fontKey);
  const isItalics = /italic|oblique/i.test(sourceName);

  return {
    name: norm,
    bold: isBold,
    italics: isItalics,
  };
};

const isLink = (text) => /^(https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,})/i.test(text.trim());
const toLinkTarget = (text) => {
  const trimmed = text.trim();
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(trimmed)) return `mailto:${trimmed}`;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/**
 * Cluster raw PDF text items into physical horizontal lines.
 */
function clusterLines(items, pageHeight) {
  const candidates = items
    .filter((item) => item.str && item.str.trim())
    .map((item) => {
      const fontSize = Math.max(7, Math.hypot(item.transform[2], item.transform[3]) || item.height || 10);
      return {
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        top: pageHeight - item.transform[5],
        bottom: pageHeight - item.transform[5] + fontSize,
        width: item.width || 0,
        height: Math.max(item.height || 0, fontSize),
        fontSize,
        fontKey: item.fontName,
      };
    })
    .sort((a, b) => a.top - b.top || a.x - b.x);

  const yClusters = [];
  for (const item of candidates) {
    const tolerance = Math.max(2.5, item.fontSize * 0.35);
    const existing = yClusters.find((l) => Math.abs(l.top - item.top) <= tolerance);
    if (existing) {
      existing.items.push(item);
    } else {
      yClusters.push({ top: item.top, y: item.y, items: [item] });
    }
  }

  // Split lines by horizontal gaps (pdf2docx line_separate_threshold)
  const lines = [];
  for (const yc of yClusters) {
    const sorted = yc.items.sort((a, b) => a.x - b.x);
    let curSegment = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const gap = curr.x - (prev.x + prev.width);

      if (gap > 20) {
        const left = Math.min(...curSegment.map((it) => it.x));
        const right = Math.max(...curSegment.map((it) => it.x + it.width));
        lines.push({
          items: curSegment,
          left,
          right,
          top: yc.top,
          bottom: yc.top + Math.max(...curSegment.map((it) => it.fontSize)),
          y: yc.y,
          width: right - left,
          fontSize: Math.max(...curSegment.map((it) => it.fontSize)),
          text: curSegment.map((it) => it.text).join(' ').trim(),
        });
        curSegment = [curr];
      } else {
        curSegment.push(curr);
      }
    }

    if (curSegment.length > 0) {
      const left = Math.min(...curSegment.map((it) => it.x));
      const right = Math.max(...curSegment.map((it) => it.x + it.width));
      lines.push({
        items: curSegment,
        left,
        right,
        top: yc.top,
        bottom: yc.top + Math.max(...curSegment.map((it) => it.fontSize)),
        y: yc.y,
        width: right - left,
        fontSize: Math.max(...curSegment.map((it) => it.fontSize)),
        text: curSegment.map((it) => it.text).join(' ').trim(),
      });
    }
  }

  return lines.sort((a, b) => a.top - b.top || a.left - b.left);
}

/**
 * Extract vector shapes (shaded boxes, lattice table cells, borders) from PDF operators.
 */
async function extractVectorShapes(page, pageHeight) {
  try {
    const opList = await page.getOperatorList();
    let curTransform = [1, 0, 0, 1, 0, 0];
    let curFill = null;
    let curStroke = null;
    const rawBoxes = [];
    const latticeCells = [];

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (fn === pdfjsLib.OPS.transform) {
        curTransform = args;
      } else if (fn === pdfjsLib.OPS.setFillRGBColor) {
        curFill = args;
      } else if (fn === pdfjsLib.OPS.setStrokeRGBColor) {
        curStroke = args;
      } else if (fn === pdfjsLib.OPS.constructPath) {
        const pathData = args[1];
        if (!pathData || !pathData[0]) continue;
        const p = pathData[0];

        // Format of constructPath rect: [0, x0, y0, 1, x1, y0, 1, x1, y1, 1, x0, y1, 4]
        let x0 = p['1'];
        let y0 = p['2'];
        let x1 = p['4'];
        let y1 = p['8'];

        if (typeof x0 !== 'number' || typeof y0 !== 'number' || typeof x1 !== 'number' || typeof y1 !== 'number') {
          continue;
        }

        const width = Math.abs(x1 - x0);
        const height = Math.abs(y1 - y0);

        if (width < 2 || height < 2) continue; // ignore tiny noise shapes

        const tx = curTransform ? curTransform[4] : 0;
        const ty = curTransform ? curTransform[5] : 0;

        const pdfLeft = Math.min(x0, x1) + tx;
        const pdfRight = Math.max(x0, x1) + tx;
        const pdfBottom = Math.min(y0, y1) + ty;
        const pdfTop = Math.max(y0, y1) + ty;

        const docTop = pageHeight - pdfTop;
        const docBottom = pageHeight - pdfBottom;

        const fillColorHex = curFill
          ? (typeof curFill[0] === 'string'
              ? curFill[0].replace('#', '').toUpperCase()
              : [curFill[0], curFill[1], curFill[2]].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase())
          : null;

        const strokeColorHex = curStroke
          ? (typeof curStroke[0] === 'string'
              ? curStroke[0].replace('#', '').toUpperCase()
              : [curStroke[0], curStroke[1], curStroke[2]].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase())
          : null;

        // Check if shaded block (e.g. gray code container)
        const isLightGray = curFill && (
          (typeof curFill[0] === 'number' && curFill[0] > 230 && curFill[1] > 230 && curFill[2] > 230) ||
          (typeof curFill[0] === 'string' && /^#f[0-9a-f]{5}$/i.test(curFill[0]))
        );

        if (isLightGray && width >= 200 && height >= 50) {
          rawBoxes.push({
            left: pdfLeft,
            right: pdfRight,
            top: docTop,
            bottom: docBottom,
            fill: fillColorHex || 'F5F5F5',
            stroke: strokeColorHex || 'D3D3D3',
          });
        } else if (width >= 20 && height >= 10) {
          // Lattice table cell candidate
          latticeCells.push({
            left: pdfLeft,
            right: pdfRight,
            top: docTop,
            bottom: docBottom,
            width,
            height,
            fill: fillColorHex,
            stroke: strokeColorHex,
          });
        }
      }
    }

    // Deduplicate shaded code boxes
    const uniqueBoxes = [];
    rawBoxes.forEach((b) => {
      const existing = uniqueBoxes.find((u) => Math.abs(u.bottom - b.bottom) < 25 && Math.abs(u.left - b.left) < 25);
      if (!existing) uniqueBoxes.push(b);
    });

    return { shadedBoxes: uniqueBoxes, latticeCells };
  } catch (_) {
    return { shadedBoxes: [], latticeCells: [] };
  }
}

/**
 * Calculate dynamic page margins in twips (pdf2docx style).
 */
function calculatePageMargins(lines, shadedBoxes, pageWidth, pageHeight) {
  let minX = pageWidth;
  let maxX = 0;
  let minY = pageHeight;
  let maxY = 0;

  lines.forEach((l) => {
    minX = Math.min(minX, l.left);
    maxX = Math.max(maxX, l.right);
    minY = Math.min(minY, l.top);
    maxY = Math.max(maxY, l.bottom);
  });

  shadedBoxes.forEach((b) => {
    minX = Math.min(minX, b.left);
    maxX = Math.max(maxX, b.right);
    minY = Math.min(minY, b.top);
    maxY = Math.max(maxY, b.bottom);
  });

  if (minX >= maxX || minY >= maxY) {
    return { top: 720, bottom: 720, left: 1080, right: 1080 };
  }

  // Clamped between 36pt (720 twips) and 72pt (1440 twips)
  const leftTwips = Math.round(Math.max(36, Math.min(72, minX)) * PDF_POINT_TO_TWIP);
  const rightTwips = Math.round(Math.max(36, Math.min(72, pageWidth - maxX)) * PDF_POINT_TO_TWIP);
  const topTwips = Math.round(Math.max(36, Math.min(72, minY * SETTINGS.pageMarginFactorTop)) * PDF_POINT_TO_TWIP);
  const bottomTwips = Math.round(Math.max(36, Math.min(72, (pageHeight - maxY) * SETTINGS.pageMarginFactorBottom)) * PDF_POINT_TO_TWIP);

  return {
    top: topTwips,
    bottom: bottomTwips,
    left: leftTwips,
    right: rightTwips,
  };
}

function isCodeLine(line) {
  const text = line.text.trim();
  if (/^[{}[\]],?$/.test(text)) return true;
  if (/^"[a-zA-Z0-9_]+":/.test(text)) return true;
  if (/^[{[][\s\S]*[}\]]$/.test(text) && text.includes('"')) return true;
  return false;
}

function isHeadingText(text) {
  return /^(Endpoint:|Request Body:|Response Structure|Base URL|Authentication|\d+\.\s+[A-Z])/i.test(text.trim());
}

/**
 * Detects headings from line font size, weight, and text patterns.
 */
function getHeadingLevel(line) {
  const text = line.text.trim();
  if (line.fontSize >= 17) {
    return { level: HeadingLevel.HEADING_1, before: 180, after: 100 };
  }
  if (line.fontSize >= 13 || /^\d+\.\s+[A-Z]/.test(text)) {
    return { level: HeadingLevel.HEADING_2, before: 160, after: 80 };
  }
  if (
    (line.items.length === 1 && line.items[0].fontSize >= 10 && /bold|_f2$/i.test(line.items[0].fontKey)) ||
    /^(Endpoint:|Request Body:|Response Structure|Base URL|Authentication)/i.test(text)
  ) {
    return { level: HeadingLevel.HEADING_3, before: 120, after: 50 };
  }
  return null;
}

/**
 * Partitions page lines into structured sections:
 * - Code Blocks (shaded containers)
 * - Lattice Tables (detected from vector cells)
 * - Multi-Column Sections
 * - Stream Data Tables
 * - Fluid Paragraphs and Headings
 */
function partitionPageSections(lines, vectorShapes, pageWidth) {
  const sections = [];
  const processedLines = new Set();
  const { shadedBoxes, latticeCells } = vectorShapes;

  // 1. Shaded code/callout vector boxes
  shadedBoxes.forEach((box) => {
    const boxLines = lines.filter((l) => {
      if (isHeadingText(l.text) || l.fontSize >= 13) return false;
      return l.top >= box.top + 4 && l.top <= box.bottom + 12 && l.left >= box.left - 25;
    });

    if (boxLines.length > 0) {
      boxLines.forEach((l) => processedLines.add(l));
      sections.push({
        type: 'code-block',
        lines: boxLines,
        fill: box.fill || 'F4F4F4',
        stroke: box.stroke || 'D3D3D3',
      });
    }
  });

  // 2. Lattice tables (from vector cells if 4+ cells exist)
  if (latticeCells.length >= 4) {
    const tblTop = Math.min(...latticeCells.map((c) => c.top));
    const tblBottom = Math.max(...latticeCells.map((c) => c.bottom));
    const tblLeft = Math.min(...latticeCells.map((c) => c.left));
    const tblRight = Math.max(...latticeCells.map((c) => c.right));

    const tableLines = lines.filter((l) => {
      if (processedLines.has(l)) return false;
      return l.top >= tblTop - 10 && l.bottom <= tblBottom + 10 && l.left >= tblLeft - 10 && l.right <= tblRight + 10;
    });

    if (tableLines.length >= 2) {
      tableLines.forEach((l) => processedLines.add(l));
      sections.push({
        type: 'lattice-table',
        lines: tableLines,
        cells: latticeCells,
      });
    }
  }

  // 3. Scan remaining lines for code heuristics (fallback)
  const remainingLines = lines.filter((l) => !processedLines.has(l));
  let curCodeLines = [];
  let curOtherLines = [];

  const flushCode = () => {
    if (curCodeLines.length > 0) {
      sections.push({
        type: 'code-block',
        lines: curCodeLines,
        fill: 'F4F4F4',
        stroke: 'D3D3D3',
      });
      curCodeLines = [];
    }
  };

  const flushOther = () => {
    if (curOtherLines.length > 0) {
      sections.push(...analyzeOtherSections(curOtherLines, pageWidth));
      curOtherLines = [];
    }
  };

  for (let i = 0; i < remainingLines.length; i++) {
    const line = remainingLines[i];
    if (isCodeLine(line) && !isHeadingText(line.text)) {
      flushOther();
      curCodeLines.push(line);
    } else {
      if (curCodeLines.length > 0) flushCode();
      curOtherLines.push(line);
    }
  }

  flushCode();
  flushOther();

  // Sort sections vertically by top coordinate
  return sections.sort((a, b) => {
    const topA = a.lines?.[0]?.top || a.leftLines?.[0]?.top || 0;
    const topB = b.lines?.[0]?.top || b.leftLines?.[0]?.top || 0;
    return topA - topB;
  });
}

function analyzeOtherSections(lines, pageWidth) {
  const results = [];
  const midX = pageWidth / 2;

  // Check multi-column layout
  const leftColLines = lines.filter((l) => l.right <= midX);
  const rightColLines = lines.filter((l) => l.left >= midX);
  const spanningLines = lines.filter((l) => l.left < midX && l.right > midX);

  if (leftColLines.length >= 3 && rightColLines.length >= 3 && spanningLines.length <= 2) {
    const titleLines = [];
    const leftLines = [];
    const rightLines = [];

    const colTop = Math.min(leftColLines[0]?.top || Infinity, rightColLines[0]?.top || Infinity);

    lines.forEach((l) => {
      if (l.top < colTop - 5 || (l.left < midX && l.right > midX)) {
        titleLines.push(l);
      } else if (l.right <= midX) {
        leftLines.push(l);
      } else if (l.left >= midX) {
        rightLines.push(l);
      }
    });

    if (titleLines.length > 0) results.push({ type: 'text', lines: titleLines });
    results.push({ type: 'multi-column', leftLines, rightLines });
    return results;
  }

  // Check stream tables
  let curTbl = [];
  let curText = [];

  const flushTbl = () => {
    if (curTbl.length >= 2) results.push({ type: 'table', lines: curTbl });
    else if (curTbl.length === 1) curText.push(curTbl[0]);
    curTbl = [];
  };
  const flushText = () => {
    if (curText.length > 0) results.push({ type: 'text', lines: curText });
    curText = [];
  };

  for (const line of lines) {
    const isTabular =
      line.items.length >= 3 ||
      (line.items.length === 2 && line.right - line.left > 150 && !line.text.includes('—') && !line.text.includes(':'));

    if (isTabular) {
      flushText();
      curTbl.push(line);
    } else {
      flushTbl();
      curText.push(line);
    }
  }

  flushTbl();
  flushText();

  return results;
}

/**
 * Builds a shaded, bordered Code / Visual Callout Box in Word.
 */
function buildDocxCodeBlock(codeLines, page, fill = 'F5F5F5', stroke = 'D3D3D3') {
  const codeParagraphs = codeLines.map((line) => {
    const leadingSpaces = line.text.match(/^ +/)?.[0]?.length || 0;
    const indentPrefix = '\u00A0'.repeat(leadingSpaces);
    const cleanText = line.text.trim();

    return new Paragraph({
      children: [
        new TextRun({
          text: indentPrefix + cleanText,
          font: 'Consolas',
          size: 18, // 9pt
          color: '1E293B',
        }),
      ],
      spacing: { before: 20, after: 20, line: 240, lineRule: 'auto' },
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: stroke },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: stroke },
      left: { style: BorderStyle.SINGLE, size: 4, color: stroke },
      right: { style: BorderStyle.SINGLE, size: 4, color: stroke },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: codeParagraphs,
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds a docx Table from structured table lines and optional vector cells (Lattice / Stream table).
 */
function buildDocxTable(tableLines, page, vectorCells = []) {
  const allX = [];
  tableLines.forEach((tl) => {
    tl.items.forEach((it) => allX.push(it.x));
  });
  allX.sort((a, b) => a - b);

  const colGuides = [];
  allX.forEach((x) => {
    const existing = colGuides.find((cg) => Math.abs(cg.center - x) <= 18);
    if (existing) {
      existing.pts.push(x);
      existing.center = existing.pts.reduce((a, b) => a + b, 0) / existing.pts.length;
    } else {
      colGuides.push({ center: x, pts: [x] });
    }
  });

  const numCols = Math.max(2, colGuides.length);
  const rows = [];

  // Group lines sharing same vertical coordinate (top) into actual table rows
  const tableRowGroups = [];
  tableLines.forEach((line) => {
    const existingRow = tableRowGroups.find((rg) => Math.abs(rg.top - line.top) <= 5);
    if (existingRow) {
      existingRow.items.push(...line.items);
    } else {
      tableRowGroups.push({ top: line.top, items: [...line.items] });
    }
  });
  tableRowGroups.sort((a, b) => a.top - b.top);

  tableRowGroups.forEach((rowGroup, rIdx) => {
    const cellsContent = Array(numCols).fill(null).map(() => []);

    rowGroup.items.forEach((item) => {
      let closestIdx = 0;
      let minDiff = Infinity;
      colGuides.forEach((cg, idx) => {
        const diff = Math.abs(cg.center - item.x);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      cellsContent[closestIdx].push(item);
    });

    const isHeader = rIdx === 0;

    // Check if vector cells provide custom row background (e.g. dark header or alternate row fill)
    let matchedFill = undefined;
    if (vectorCells.length > 0) {
      const lineY = rowGroup.top;
      const cellInRow = vectorCells.find((c) => Math.abs(c.top - lineY) < 15);
      if (cellInRow && cellInRow.fill && cellInRow.fill !== 'FFFFFF') {
        matchedFill = cellInRow.fill;
      }
    }

    const tableCells = cellsContent.map((itemsInCell) => {
      const text = itemsInCell.map((i) => i.text).join(' ').trim();
      const isNum = /^[\d,.$€£%+-]+$/.test(text);

      const isDarkHeader = isHeader && (matchedFill === '1F3B5E' || matchedFill === '0F172A' || !matchedFill);
      const textColor = isDarkHeader && isHeader ? 'FFFFFF' : (isHeader ? '0F172A' : '334155');

      const run = new TextRun({
        text: text || ' ',
        font: 'Arial',
        size: isHeader ? 20 : 18,
        bold: isHeader || itemsInCell.some((i) => /bold/i.test(i.fontKey)),
        color: textColor,
      });

      return new TableCell({
        children: [
          new Paragraph({
            children: [run],
            alignment: isNum ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { before: 40, after: 40 },
          }),
        ],
        verticalAlign: VerticalAlign.CENTER,
        shading: {
          type: ShadingType.CLEAR,
          fill: matchedFill || (isHeader ? '1F3B5E' : (rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF')),
        },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
      });
    });

    rows.push(new TableRow({ children: tableCells, cantSplit: true, tableHeader: isHeader }));
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    },
  });
}

/**
 * Builds a borderless multi-column layout table preserving independent column flows.
 */
function buildMultiColumnTable(leftLines, rightLines, page, pageWidth) {
  const leftColWidth = pageWidth / 2 - 40;
  const leftParagraphs = assembleParagraphsFromLines(leftLines, page, leftColWidth);
  const rightParagraphs = assembleParagraphsFromLines(rightLines, page, leftColWidth);

  const leftCell = new TableCell({
    children: leftParagraphs.length > 0 ? leftParagraphs : [new Paragraph('')],
    width: { size: 48, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 40, left: 40, right: 100 },
  });

  const rightCell = new TableCell({
    children: rightParagraphs.length > 0 ? rightParagraphs : [new Paragraph('')],
    width: { size: 48, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 40, left: 100, right: 40 },
  });

  const row = new TableRow({ children: [leftCell, rightCell] });

  return new Table({
    rows: [row],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
}

/**
 * pdf2docx Paragraph Assembly Algorithm:
 * Groups physical lines into fluid, reflowable Word paragraphs based on line spacing ratio,
 * text alignment, headings, and list structures.
 */
function assembleParagraphsFromLines(lines, page, blockWidth) {
  if (lines.length === 0) return [];

  const rawParagraphs = [];
  let currentGroup = [lines[0]];

  for (let i = 1; i < lines.length; i++) {
    const prevLine = lines[i - 1];
    const currLine = lines[i];

    const headingCurr = getHeadingLevel(currLine);
    const headingPrev = getHeadingLevel(prevLine);

    const isBulletCurr = /^[•▪\-*]\s+/.test(currLine.text);
    const isNumListCurr = /^\d+\.\s+/.test(currLine.text) && !headingCurr;

    const verticalGap = currLine.top - prevLine.bottom;
    const lineHeight = prevLine.fontSize;
    const maxSpacing = SETTINGS.maxLineSpacingRatio * lineHeight;

    const fontDiff = Math.abs(currLine.fontSize - prevLine.fontSize) > 1.5;
    const prevEndsColon = /:\s*$/.test(prevLine.text);

    // Check if prevLine wrapped naturally or ended with a hard break
    const freeSpace = (blockWidth - prevLine.width) / blockWidth;
    const isHardBreak = freeSpace > 0.35 && verticalGap > 4;

    const shouldStartNew =
      headingCurr ||
      headingPrev ||
      isBulletCurr ||
      isNumListCurr ||
      fontDiff ||
      prevEndsColon ||
      isHardBreak ||
      verticalGap > maxSpacing;

    if (shouldStartNew) {
      rawParagraphs.push(currentGroup);
      currentGroup = [currLine];
    } else {
      currentGroup.push(currLine);
    }
  }

  if (currentGroup.length > 0) {
    rawParagraphs.push(currentGroup);
  }

  // Convert grouped lines into docx Paragraphs
  const docxParagraphs = [];

  for (const group of rawParagraphs) {
    const firstLine = group[0];
    const fullText = group.map((l) => l.text).join(' ');
    const headingInfo = getHeadingLevel(firstLine);

    // Detect alignment across group
    let alignment = AlignmentType.LEFT;
    const groupCenter = (firstLine.left + firstLine.right) / 2;
    if (Math.abs(groupCenter - blockWidth / 2) <= SETTINGS.linesCenterAlignedThreshold * 3) {
      alignment = AlignmentType.CENTER;
    } else if (Math.abs(firstLine.right - (blockWidth - 10)) <= SETTINGS.linesRightAlignedThreshold * 2) {
      alignment = AlignmentType.RIGHT;
    }

    const isBullet = /^[•▪\-*]\s+/.test(fullText);
    const isNumList = /^\d+\.\s+/.test(fullText) && !headingInfo;

    // Build runs preserving formatting and links
    const runs = [];

    group.forEach((line, lineIdx) => {
      line.items.forEach((it, itIdx) => {
        const font = getFontProps(page, it.fontKey, it.text);
        let runText = it.text;

        if (lineIdx === 0 && itIdx === 0) {
          if (isBullet) runText = runText.replace(/^[•▪\-*]\s*/, '');
          if (isNumList) runText = runText.replace(/^\d+\.\s*/, '');
        }

        if (!runText) return;

        const needsPrefixSpace = (lineIdx > 0 && itIdx === 0) || (itIdx > 0 && !runText.startsWith(' '));
        const finalRunText = (needsPrefixSpace ? ' ' : '') + runText;

        const run = new TextRun({
          text: finalRunText,
          font: font.name,
          size: Math.min(72, Math.max(16, Math.round(it.fontSize * 2))),
          bold: Boolean(headingInfo) || font.bold,
          italics: font.italics,
          color: headingInfo ? '1E3A5F' : '1F2937',
        });

        if (isLink(runText)) {
          runs.push(
            new ExternalHyperlink({
              link: toLinkTarget(runText),
              children: [
                new TextRun({
                  text: finalRunText,
                  font: font.name,
                  size: Math.min(72, Math.max(16, Math.round(it.fontSize * 2))),
                  color: '2563EB',
                  underline: {},
                }),
              ],
            })
          );
        } else {
          runs.push(run);
        }
      });
    });

    docxParagraphs.push(
      new Paragraph({
        children: runs,
        heading: headingInfo?.level,
        alignment,
        bullet: isBullet ? { level: 0 } : undefined,
        spacing: {
          before: headingInfo ? headingInfo.before : 60,
          after: headingInfo ? headingInfo.after : 60,
          line: 276,
        },
      })
    );
  }

  return docxParagraphs;
}

/**
 * Scanned-page fallback.
 */
async function renderScannedPage(page, width, height) {
  const scale = 1.5;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot render this scanned PDF page.');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('The scanned PDF page could not be rendered.'))),
      'image/png'
    );
  });
  const imageData = new Uint8Array(await blob.arrayBuffer());
  return new Paragraph({
    children: [
      new ImageRun({
        data: imageData,
        transformation: {
          width: Math.round(width * (96 / 72)),
          height: Math.round(height * (96 / 72)),
        },
      }),
    ],
  });
}

/**
 * Converts a PDF document into a rich editable Word document (.docx) using pdf2docx principles.
 */
export async function convertPdfToWord(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let scannedCount = 0;
  const sections = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const lines = clusterLines(content.items, viewport.height);
    const vectorShapes = await extractVectorShapes(page, viewport.height);
    const margins = calculatePageMargins(lines, vectorShapes.shadedBoxes, viewport.width, viewport.height);

    const children = [];

    if (lines.length === 0) {
      scannedCount++;
      children.push(await renderScannedPage(page, viewport.width, viewport.height));
    } else {
      const sectionBlocks = partitionPageSections(lines, vectorShapes, viewport.width);
      for (const block of sectionBlocks) {
        if (block.type === 'code-block') {
          children.push(buildDocxCodeBlock(block.lines, page, block.fill, block.stroke));
          children.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
        } else if (block.type === 'lattice-table') {
          children.push(buildDocxTable(block.lines, page, block.cells));
          children.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
        } else if (block.type === 'table') {
          children.push(buildDocxTable(block.lines, page));
          children.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
        } else if (block.type === 'multi-column') {
          children.push(buildMultiColumnTable(block.leftLines, block.rightLines, page, viewport.width));
          children.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
        } else {
          children.push(...assembleParagraphsFromLines(block.lines, page, viewport.width));
        }
      }
    }

    sections.push({
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: {
            width: Math.round(viewport.width * PDF_POINT_TO_TWIP),
            height: Math.round(viewport.height * PDF_POINT_TO_TWIP),
          },
          margin: margins,
        },
      },
      children,
    });
  }

  const doc = new Document({ sections });
  const blob = await Packer.toBlob(doc);

  const message = scannedCount
    ? `Converted with ${scannedCount} scanned page${scannedCount === 1 ? '' : 's'} preserved as images (OCR not available in browser).`
    : 'PDF converted to editable Word document with fluid paragraphs, code containers, tables, and headings.';

  return {
    blob,
    fileName: `${fileStem(file.name)}.docx`,
    message,
  };
}
