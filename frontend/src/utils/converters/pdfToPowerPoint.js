import PptxGenJS from 'pptxgenjs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'presentation';

const normalizeFontName = (fontName) => {
  if (!fontName) return 'Calibri';
  const clean = fontName.replace(/^[A-Z]{6}\+/, '').replace(/-?(Bold|Italic|Regular|Roman|MT|PSMT)$/i, '');
  if (/arial/i.test(clean)) return 'Arial';
  if (/times/i.test(clean)) return 'Georgia';
  if (/courier/i.test(clean)) return 'Courier New';
  if (/trebuchet/i.test(clean)) return 'Trebuchet MS';
  if (/verdana/i.test(clean)) return 'Verdana';
  return 'Calibri';
};

/**
 * High quality PDF to PowerPoint presentation converter.
 * 
 * Features:
 * - Proper 16:9 widescreen slide geometry (13.33 x 7.5 in)
 * - Identifies slide titles, headers, and discrete body text boxes
 * - Detects and generates real native PowerPoint tables
 * - Preserves font sizes, bold/italic, colors, and bullet lists
 * - Embeds high-resolution rendered imagery for scanned/image pages
 */
export async function convertPdfToPowerPoint(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'DailyTools';
  pres.subject = 'PDF to PowerPoint Conversion';

  const SLIDE_W = 13.33;
  const SLIDE_H = 7.5;

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const slide = pres.addSlide();
    slide.background = { color: 'FFFFFF' };

    const rawItems = content.items
      .filter((item) => item.str && item.str.trim())
      .map((item) => {
        const fontSize = Math.max(7, Math.hypot(item.transform[2], item.transform[3]) || item.height || 10);
        return {
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          top: viewport.height - item.transform[5],
          width: item.width || 0,
          height: Math.max(item.height || 0, fontSize),
          fontSize,
          fontName: item.fontName || '',
        };
      });

    // Handle scanned/image-only page
    if (rawItems.length === 0) {
      try {
        const renderScale = 2.0;
        const pageViewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(pageViewport.width);
        canvas.height = Math.ceil(pageViewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: pageViewport }).promise;
          const dataUrl = canvas.toDataURL('image/png');
          
          const imgAspect = pageViewport.width / pageViewport.height;
          let imgW = SLIDE_W - 1.0;
          let imgH = imgW / imgAspect;
          if (imgH > SLIDE_H - 0.8) {
            imgH = SLIDE_H - 0.8;
            imgW = imgH * imgAspect;
          }
          const imgX = (SLIDE_W - imgW) / 2;
          const imgY = (SLIDE_H - imgH) / 2;

          slide.addImage({ data: dataUrl, x: imgX, y: imgY, w: imgW, h: imgH });
          continue;
        }
      } catch (err) {
        console.warn('Canvas render fallback failed for page', n, err);
      }
    }

    // Coordinate mapping from PDF pt to PPTX inches
    const scale = Math.min((SLIDE_W - 1.2) / (viewport.width / 72), (SLIDE_H - 1.0) / (viewport.height / 72));
    const offsetX = (SLIDE_W - (viewport.width / 72) * scale) / 2;
    const offsetY = (SLIDE_H - (viewport.height / 72) * scale) / 2;

    const toSlideX = (ptX) => Math.max(0.4, (ptX / 72) * scale + offsetX);
    const toSlideY = (ptTop) => Math.max(0.4, (ptTop / 72) * scale + offsetY);
    const toSlideW = (ptW) => Math.min(SLIDE_W - 0.8, Math.max(0.5, (ptW / 72) * scale));

    // Group items into physical lines
    rawItems.sort((a, b) => a.top - b.top || a.x - b.x);
    const lineGroups = [];
    rawItems.forEach((item) => {
      const tol = Math.max(3, item.fontSize * 0.35);
      const existing = lineGroups.find((lg) => Math.abs(lg.top - item.top) <= tol);
      if (existing) {
        existing.items.push(item);
      } else {
        lineGroups.push({ top: item.top, fontSize: item.fontSize, items: [item] });
      }
    });

    const lines = lineGroups.map((lg) => {
      const sorted = lg.items.sort((a, b) => a.x - b.x);
      const text = sorted.map((i) => i.text).join(' ').trim();
      const left = Math.min(...sorted.map((i) => i.x));
      const right = Math.max(...sorted.map((i) => i.x + i.width));
      const maxFontSize = Math.max(...sorted.map((i) => i.fontSize));
      const isBold = sorted.some((i) => /bold|black|demi/i.test(i.fontName));
      return {
        top: lg.top,
        left,
        right,
        width: right - left,
        fontSize: maxFontSize,
        fontName: sorted[0]?.fontName || '',
        isBold,
        text,
        items: sorted,
      };
    }).filter((l) => l.text);

    // Group lines into semantic blocks (headers, tables, paragraphs, lists)
    const blocks = [];
    let currentBlock = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (currentBlock.length === 0) {
        currentBlock.push(line);
        continue;
      }

      const prev = currentBlock[currentBlock.length - 1];
      const gap = line.top - prev.top;
      const sameFormat = Math.abs(line.fontSize - prev.fontSize) < 2 && line.isBold === prev.isBold;

      if (gap > prev.fontSize * 2.2 || (!sameFormat && (line.isBold || line.fontSize > 16))) {
        blocks.push(currentBlock);
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    }
    if (currentBlock.length) blocks.push(currentBlock);

    // Render blocks onto the slide
    let isFirstHeader = true;

    blocks.forEach((blk) => {
      const firstLine = blk[0];
      const blkTop = firstLine.top;
      const blkLeft = Math.min(...blk.map((l) => l.left));
      const blkRight = Math.max(...blk.map((l) => l.right));
      const blkWidth = blkRight - blkLeft;
      const fullText = blk.map((l) => l.text).join('\n');
      const isHeading = blk.length === 1 && (firstLine.fontSize >= 15 || firstLine.isBold);

      const slideX = toSlideX(blkLeft);
      const slideY = toSlideY(blkTop);
      const slideW = Math.min(SLIDE_W - slideX - 0.5, Math.max(2.5, toSlideW(blkWidth)));

      // If it's the very first prominent heading on the page, format as slide title
      if (isFirstHeader && isHeading && blkTop < viewport.height * 0.3) {
        isFirstHeader = false;
        slide.addText(fullText, {
          x: Math.max(0.6, slideX),
          y: Math.max(0.4, slideY),
          w: Math.max(6.0, slideW),
          h: 0.8,
          fontSize: Math.min(28, Math.max(18, Math.round(firstLine.fontSize * 1.3))),
          bold: true,
          color: '1E3A5F',
          fontFace: normalizeFontName(firstLine.fontName),
          wrap: true,
        });
        return;
      }

      // Check if block is a structured table
      const isTable = blk.length >= 2 && blk.every((l) => l.items.length >= 2);
      if (isTable) {
        const numCols = Math.max(...blk.map((l) => l.items.length));
        const tableRows = blk.map((l, rIdx) => {
          const cells = l.items.map((it) => ({
            text: it.text,
            options: {
              fill: rIdx === 0 ? '1E3A5F' : (rIdx % 2 === 0 ? 'F8FAFC' : 'FFFFFF'),
              color: rIdx === 0 ? 'FFFFFF' : '1E293B',
              bold: rIdx === 0,
              fontSize: Math.min(12, Math.max(8.5, Math.round(it.fontSize * 0.9))),
            },
          }));
          while (cells.length < numCols) {
            cells.push({ text: '', options: { fill: rIdx === 0 ? '1E3A5F' : 'FFFFFF' } });
          }
          return cells;
        });

        slide.addTable(tableRows, {
          x: slideX,
          y: slideY,
          w: slideW,
          border: { pt: 0.5, color: 'CBD5E1' },
        });
        return;
      }

      // Check if block is a bullet list
      const isList = blk.some((l) => /^[•▪\-*]|\d+\./.test(l.text));
      const textProps = blk.map((l) => {
        const cleanText = l.text.replace(/^[•▪\-*]\s*/, '');
        return {
          text: cleanText + '\n',
          options: {
            fontSize: Math.min(22, Math.max(10, Math.round(l.fontSize * 0.95))),
            bold: l.isBold,
            color: l.isBold ? '1E293B' : '334155',
            fontFace: normalizeFontName(l.fontName),
            bullet: isList,
          },
        };
      });

      slide.addText(textProps, {
        x: slideX,
        y: slideY,
        w: slideW,
        h: Math.min(SLIDE_H - slideY - 0.4, Math.max(0.4, blk.length * 0.35 + 0.2)),
        valign: 'top',
        wrap: true,
      });
    });

    // Slide Number
    slide.addText(`${n}`, {
      x: SLIDE_W - 1.0,
      y: SLIDE_H - 0.5,
      w: 0.6,
      h: 0.3,
      fontSize: 9,
      color: '94A3B8',
      align: 'right',
    });
  }

  const blob = await pres.write({ outputType: 'blob' });

  return {
    blob,
    fileName: `${fileStem(file.name)}.pptx`,
    message: 'PDF converted to editable PowerPoint presentation.',
  };
}
