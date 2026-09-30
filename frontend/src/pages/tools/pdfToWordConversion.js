import {
  Document,
  ExternalHyperlink,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  TextRun,
} from 'docx';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PDF_POINT_TO_TWIP = 20;
const PDF_POINT_TO_PIXEL = 96 / 72;
const SUBSET_FONT_PREFIX = /^[A-Z]{6}\+/;
const ICON_FONT_RE = /fontawesome|webdings|wingdings|symbol/i;
const ICON_REPLACEMENTS = {
  '\uf095': '\u260e',
  '\uf0e0': '\u2709',
  '\uf0c1': '\ud83d\udd17',
  '\uf2bd': '\u25cf',
  '\uf3c5': '\u25cf',
};

// ---------------------------------------------------------------------------
// Font helpers
// ---------------------------------------------------------------------------
const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'document';

const normalizeFontName = (fontName) => {
  const unprefixed = (fontName || 'Arial').replace(SUBSET_FONT_PREFIX, '');
  if (ICON_FONT_RE.test(unprefixed)) return 'Arial';
  return (
    unprefixed
      .replace(/-(Bold|Italic|BoldItalic|BoldOblique|Oblique|Regular|Roman|MT|PSMT)$/i, '')
      .replace(/(BoldItalic|Bold|Italic|MT|PSMT)$/i, '') || 'Arial'
  );
};

const getFontProperties = (page, fontKey) => {
  let sourceName = fontKey || '';
  try {
    sourceName = page.commonObjs.get(fontKey)?.name || fontKey || '';
  } catch (_) { /* ignore */ }
  return {
    name: normalizeFontName(sourceName),
    bold: /bold|black|demi|heavy/i.test(sourceName),
    italics: /italic|oblique/i.test(sourceName),
    isIcon: ICON_FONT_RE.test(sourceName),
    sourceName,
  };
};

const normalizeIconText = (text, isIcon) => {
  if (!isIcon) return text;
  return Array.from(text).map((ch) => ICON_REPLACEMENTS[ch] || '\u25cf').join('');
};

const isLink = (text) => /^(https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,})/i.test(text);
const toLinkTarget = (text) => {
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(text)) return `mailto:${text}`;
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
};

// ---------------------------------------------------------------------------
// Text grouping helpers
// ---------------------------------------------------------------------------
function groupTextIntoLines(items, pageHeight) {
  const candidates = items
    .filter((item) => item.str && item.str.trim())
    .map((item) => {
      const fontSize = Math.max(6, Math.hypot(item.transform[2], item.transform[3]) || item.height || 10);
      return {
        text: item.str,
        x: item.transform[4],
        baseline: item.transform[5],
        top: pageHeight - item.transform[5],
        width: item.width || 0,
        height: Math.max(item.height || 0, fontSize),
        fontSize,
        fontKey: item.fontName,
      };
    })
    .sort((a, b) => b.baseline - a.baseline || a.x - b.x);

  const lines = [];
  for (const item of candidates) {
    const tolerance = Math.max(2.5, item.fontSize * 0.30);
    const existing = lines.find((l) => Math.abs(l.baseline - item.baseline) <= tolerance);
    if (existing) {
      existing.items.push(item);
      existing.baseline =
        (existing.baseline * (existing.items.length - 1) + item.baseline) / existing.items.length;
    } else {
      lines.push({ baseline: item.baseline, items: [item] });
    }
  }

  return lines
    .map((l) => {
      const sorted = l.items.sort((a, b) => a.x - b.x);
      const left = Math.min(...sorted.map((i) => i.x));
      const right = Math.max(...sorted.map((i) => i.x + i.width));
      const top = Math.min(...sorted.map((i) => i.top));
      const height = Math.max(...sorted.map((i) => i.height));
      return { items: sorted, left, right, top, height };
    })
    .sort((a, b) => a.top - b.top || a.left - b.left);
}

function groupLinesIntoParagraphs(lines) {
  if (!lines.length) return [];
  const avgH = lines.reduce((s, l) => s + l.height, 0) / lines.length;
  const GAP = avgH * 1.5;
  const blocks = [];
  let current = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].top - lines[i - 1].top > GAP) {
      blocks.push(current);
      current = [];
    }
    current.push(lines[i]);
  }
  if (current.length) blocks.push(current);
  return blocks;
}

// ---------------------------------------------------------------------------
// DOCX element builders
// ---------------------------------------------------------------------------
function lineToTextRuns(line, page) {
  const runs = [];
  let prevRight = line.items[0]?.x ?? 0;

  for (let idx = 0; idx < line.items.length; idx++) {
    const item = line.items[idx];
    const font = getFontProperties(page, item.fontKey);
    const text = normalizeIconText(item.text, font.isIcon);

    // Insert space for visible gaps between adjacent text items
    if (idx > 0) {
      const gap = item.x - prevRight;
      const threshold = Math.max(1.5, item.fontSize * 0.25);
      if (gap > threshold) runs.push(new TextRun({ text: ' ' }));
    }

    const run = new TextRun({
      text,
      font: font.name,
      // docx size is in half-points; PDF fontSize is in points
      size: Math.min(144, Math.max(12, Math.round(item.fontSize * 2))),
      bold: font.bold,
      italics: font.italics,
      color: '1A1A1A',
    });

    runs.push(
      isLink(text)
        ? new ExternalHyperlink({ link: toLinkTarget(text), children: [run] })
        : run
    );
    prevRight = Math.max(prevRight, item.x + item.width);
  }

  return runs;
}

function paragraphsFromLines(lines, page) {
  const blocks = groupLinesIntoParagraphs(lines);

  return blocks.map((block) => {
    const children = [];
    block.forEach((line, li) => {
      children.push(...lineToTextRuns(line, page));
      // Soft line-break within the paragraph block (not a new paragraph)
      if (li < block.length - 1) children.push(new TextRun({ break: 1 }));
    });
    return new Paragraph({
      children,
      spacing: { before: 80, after: 80, line: 276, lineRule: 'auto' },
    });
  });
}

// ---------------------------------------------------------------------------
// Scanned-page fallback: render to canvas, embed as PNG image
// ---------------------------------------------------------------------------
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
          width: Math.round(width * PDF_POINT_TO_PIXEL),
          height: Math.round(height * PDF_POINT_TO_PIXEL),
        },
      }),
    ],
    spacing: { before: 0, after: 0 },
  });
}

// ---------------------------------------------------------------------------
// PDF extraction
// ---------------------------------------------------------------------------
async function extractLayoutPages(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    pages.push({
      page,
      width: viewport.width,
      height: viewport.height,
      lines: groupTextIntoLines(content.items, viewport.height),
    });
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function convertPdfToWord(file) {
  const layoutPages = await extractLayoutPages(file);
  let scannedPageCount = 0;

  const sections = await Promise.all(
    layoutPages.map(async (lp) => {
      let children;
      if (lp.lines.length > 0) {
        children = paragraphsFromLines(lp.lines, lp.page);
      } else {
        scannedPageCount++;
        children = [await renderScannedPage(lp.page, lp.width, lp.height)];
      }

      return {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: {
              width: Math.round(lp.width * PDF_POINT_TO_TWIP),
              height: Math.round(lp.height * PDF_POINT_TO_TWIP),
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
              header: 0,
              footer: 0,
              gutter: 0,
            },
          },
        },
        children,
      };
    })
  );

  const document = new Document({ sections });
  const blob = await Packer.toBlob(document);

  const message = scannedPageCount
    ? `Converted with ${scannedPageCount} scanned page${scannedPageCount === 1 ? '' : 's'} preserved as images; OCR is not available in the browser.`
    : 'Conversion complete.';

  return { blob, fileName: `${fileStem(file.name)}.docx`, message };
}
