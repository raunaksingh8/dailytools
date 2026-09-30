import {
  Document,
  ExternalHyperlink,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  Textbox,
  TextRun,
} from 'docx';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const PDF_POINT_TO_TWIP = 20;
const PDF_POINT_TO_PIXEL = 96 / 72;
const SUBSET_FONT_PREFIX = /^[A-Z]{6}\+/;
const ICON_REPLACEMENTS = {
  '\uf095': '\u260e',
  '\uf0e0': '\u2709',
  '\uf0c1': '\ud83d\udd17',
  '\uf2bd': '\u25cf',
  '\uf3c5': '\u25cf',
};

const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'document';

const toPoints = (value) => `${Math.max(0, value).toFixed(2)}pt`;

const normalizeIconText = (text, fontName) => {
  if (!/fontawesome/i.test(fontName || '')) return text;
  return Array.from(text).map((character) => ICON_REPLACEMENTS[character] || character).join('');
};

const normalizeFontName = (fontName) => {
  const unprefixed = (fontName || 'Arial').replace(SUBSET_FONT_PREFIX, '');
  if (/fontawesome/i.test(unprefixed)) return 'Arial';
  return unprefixed
    .replace(/-(Bold|Italic|BoldItalic|BoldOblique|Oblique|Regular|Roman|MT|PSMT)$/i, '')
    .replace(/(BoldItalic|Bold|Italic|MT|PSMT)$/i, '') || 'Arial';
};

const getFontProperties = (page, fontKey) => {
  const sourceName = page.commonObjs.get(fontKey)?.name || fontKey;
  return {
    name: normalizeFontName(sourceName),
    bold: /bold|black|demi|heavy/i.test(sourceName),
    italics: /italic|oblique/i.test(sourceName),
    sourceName,
  };
};

const isLink = (text) => /^(https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,})/i.test(text);

const toLinkTarget = (text) => {
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(text)) return `mailto:${text}`;
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
};

const spacingText = (gap, fontSize) => {
  if (gap <= Math.max(1.5, fontSize * 0.18)) return '';
  return gap > fontSize * 1.25 ? '\t' : ' ';
};

function groupTextIntoLines(items, pageHeight) {
  const candidates = items
    .filter((item) => item.str && item.str.trim())
    .map((item) => {
      const fontSize = Math.max(6, Math.hypot(item.transform[2], item.transform[3]) || item.height || 10);
      const top = pageHeight - item.transform[5] - Math.max(item.height || 0, fontSize);
      return {
        text: item.str,
        x: item.transform[4],
        baseline: item.transform[5],
        top,
        width: item.width || 0,
        height: Math.max(item.height || 0, fontSize),
        fontSize,
        fontKey: item.fontName,
      };
    })
    .sort((first, second) => second.baseline - first.baseline || first.x - second.x);

  const lines = [];
  candidates.forEach((item) => {
    const tolerance = Math.max(2.5, item.fontSize * 0.28);
    const line = lines.find((candidate) => Math.abs(candidate.baseline - item.baseline) <= tolerance);
    if (line) {
      line.items.push(item);
      line.baseline = (line.baseline * (line.items.length - 1) + item.baseline) / line.items.length;
    } else {
      lines.push({ baseline: item.baseline, items: [item] });
    }
  });

  return lines
    .map((line) => {
      const lineItems = line.items.sort((first, second) => first.x - second.x);
      const left = Math.min(...lineItems.map((item) => item.x));
      const right = Math.max(...lineItems.map((item) => item.x + item.width));
      const top = Math.min(...lineItems.map((item) => item.top));
      const height = Math.max(...lineItems.map((item) => item.height));
      return { items: lineItems, left, right, top, height };
    })
    .sort((first, second) => first.top - second.top || first.left - second.left);
}

async function extractLayoutPages(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const [content] = await Promise.all([page.getTextContent(), page.getOperatorList()]);
    pages.push({
      page,
      width: viewport.width,
      height: viewport.height,
      lines: groupTextIntoLines(content.items, viewport.height),
    });
  }

  return pages;
}

function lineToTextbox(line, page) {
  const paragraphChildren = [];
  let previousRight = line.left;

  line.items.forEach((item, index) => {
    const font = getFontProperties(page, item.fontKey);
    const text = normalizeIconText(item.text, font.sourceName);
    const gap = index === 0 ? 0 : item.x - previousRight;
    const spacer = spacingText(gap, item.fontSize);
    if (spacer) paragraphChildren.push(new TextRun({ text: spacer }));

    const run = new TextRun({
      text,
      font: font.name,
      size: Math.max(12, Math.round(item.fontSize * 2)),
      bold: font.bold,
      italics: font.italics,
      color: '1A1A1A',
    });

    paragraphChildren.push(isLink(text)
      ? new ExternalHyperlink({ link: toLinkTarget(text), children: [run] })
      : run);
    previousRight = Math.max(previousRight, item.x + item.width);
  });

  return new Textbox({
    children: [new Paragraph({ children: paragraphChildren, spacing: { before: 0, after: 0, line: 1 } })],
    style: {
      position: 'absolute',
      positionHorizontal: 'absolute',
      positionHorizontalRelative: 'page',
      positionVertical: 'absolute',
      positionVerticalRelative: 'page',
      left: toPoints(line.left),
      top: toPoints(line.top),
      width: toPoints(Math.max(20, line.right - line.left + 3)),
      height: toPoints(Math.max(12, line.height * 1.45)),
      wrapStyle: 'none',
      zIndex: 1,
    },
  });
}

async function renderScannedPage(page, width, height) {
  const scale = 1.5;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser cannot render this scanned PDF page.');
  await page.render({ canvasContext: context, viewport }).promise;
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((image) => (image ? resolve(image) : reject(new Error('The scanned PDF page could not be rendered.'))), 'image/png');
  });
  const imageData = new Uint8Array(await blob.arrayBuffer());

  return new Paragraph({
    children: [new ImageRun({
      data: imageData,
      transformation: {
        width: width * PDF_POINT_TO_PIXEL,
        height: height * PDF_POINT_TO_PIXEL,
      },
    })],
    spacing: { before: 0, after: 0 },
  });
}

async function fixPositionedTextboxRendering(blob) {
  const archive = await JSZip.loadAsync(blob);
  const documentFile = archive.file('word/document.xml');
  if (!documentFile) throw new Error('The generated Word document is missing its main document XML.');

  const documentXml = await documentFile.async('text');
  const transparentShapes = documentXml
    .replace(/<v:shape\b([^>]*)>/g, '<v:shape$1 filled="f" stroked="f">')
    .replace(/<v:textbox\b([^>]*)>/g, '<v:textbox$1 inset="0,0,0,0">');

  archive.file('word/document.xml', transparentShapes);
  return archive.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export async function convertPdfToWord(file) {
  const pages = await extractLayoutPages(file);
  let scannedPageCount = 0;

  const sections = await Promise.all(pages.map(async (layoutPage) => {
    const children = layoutPage.lines.length
      ? layoutPage.lines.map((line) => lineToTextbox(line, layoutPage.page))
      : [await renderScannedPage(layoutPage.page, layoutPage.width, layoutPage.height)];

    if (!layoutPage.lines.length) scannedPageCount += 1;

    return {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: {
            width: Math.round(layoutPage.width * PDF_POINT_TO_TWIP),
            height: Math.round(layoutPage.height * PDF_POINT_TO_TWIP),
          },
          margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 },
        },
      },
      children,
    };
  }));

  const document = new Document({ sections });
  const message = scannedPageCount
    ? `Converted with ${scannedPageCount} scanned page${scannedPageCount === 1 ? '' : 's'} preserved as images; OCR is not available in the browser.`
    : 'Conversion complete.';

  return {
    blob: await fixPositionedTextboxRendering(await Packer.toBlob(document)),
    fileName: `${fileStem(file.name)}.docx`,
    message,
  };
}
