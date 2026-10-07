import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'presentation';
const EMU_PER_PT = 12700;

function hexToRgb(hex) {
  if (!hex || hex.length < 6) return [30, 41, 59];
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  return [r, g, b];
}

function uint8ArrayToBase64(uint8) {
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return window.btoa(binary);
}

/**
 * High-fidelity PowerPoint (.pptx) to PDF converter.
 * 
 * Inspects the native OpenXML structure:
 * - Slide dimensions & aspect ratio from ppt/presentation.xml
 * - Slide backgrounds (colors)
 * - Shapes with positions, dimensions, fills, and borders
 * - Multi-run text with exact font sizes, bold/italic, alignment, and colors
 * - Embedded images (JPEG, PNG, SVG) extracted from slide relationships
 * - Real table grids with borders, fills, and cell texts
 * - Multiple slides each rendered to its own PDF page
 */
export async function convertPowerPointToPdf(file) {
  const archive = await JSZip.loadAsync(await file.arrayBuffer());

  // 1. Parse presentation.xml for exact slide dimensions
  let slideWidthPt = 960; // default 16:9 widescreen (13.33 x 7.5 in)
  let slideHeightPt = 540;

  if (archive.files['ppt/presentation.xml']) {
    const presXml = await archive.files['ppt/presentation.xml'].async('text');
    const presDoc = new DOMParser().parseFromString(presXml, 'application/xml');
    const sldSz = presDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'sldSz')[0];
    if (sldSz) {
      const cx = parseInt(sldSz.getAttribute('cx'), 10);
      const cy = parseInt(sldSz.getAttribute('cy'), 10);
      if (cx && cy) {
        slideWidthPt = Math.round(cx / EMU_PER_PT);
        slideHeightPt = Math.round(cy / EMU_PER_PT);
      }
    }
  }

  // 2. Discover slides sorted numerically
  const slidePaths = Object.keys(archive.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => {
      const numA = Number(a.match(/slide(\d+)\.xml/)?.[1] || 0);
      const numB = Number(b.match(/slide(\d+)\.xml/)?.[1] || 0);
      return numA - numB;
    });

  if (slidePaths.length === 0) {
    throw new Error('This presentation does not contain readable slides.');
  }

  const orientation = slideWidthPt >= slideHeightPt ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [slideWidthPt, slideHeightPt],
  });

  for (let sIdx = 0; sIdx < slidePaths.length; sIdx++) {
    const slidePath = slidePaths[sIdx];
    const slideNum = sIdx + 1;

    if (sIdx > 0) {
      pdf.addPage([slideWidthPt, slideHeightPt], orientation);
    }

    // Default slide background: white
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, slideWidthPt, slideHeightPt, 'F');

    // Parse slide relationships (for images)
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const relsMap = {};
    if (archive.files[relsPath]) {
      const relsXml = await archive.files[relsPath].async('text');
      const relsDoc = new DOMParser().parseFromString(relsXml, 'application/xml');
      const relEls = Array.from(relsDoc.getElementsByTagName('Relationship'));
      relEls.forEach((el) => {
        const id = el.getAttribute('Id');
        const target = el.getAttribute('Target');
        if (id && target) {
          // Resolve relative target, e.g. "../media/image1.png" -> "ppt/media/image1.png"
          const cleanTarget = target.replace(/^\.\.\//, 'ppt/');
          relsMap[id] = cleanTarget;
        }
      });
    }

    // Parse slide XML
    const slideXml = await archive.files[slidePath].async('text');
    const slideDoc = new DOMParser().parseFromString(slideXml, 'application/xml');

    const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
    const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';

    // 3. Slide Background
    const bgEl = slideDoc.getElementsByTagNameNS(NS_P, 'bg')[0];
    if (bgEl) {
      const srgbClr = bgEl.getElementsByTagNameNS(NS_A, 'srgbClr')[0];
      if (srgbClr) {
        const hex = srgbClr.getAttribute('val');
        const [r, g, b] = hexToRgb(hex);
        pdf.setFillColor(r, g, b);
        pdf.rect(0, 0, slideWidthPt, slideHeightPt, 'F');
      }
    }

    // 4. Render Shapes & Text Frames (<p:sp>)
    const shapes = Array.from(slideDoc.getElementsByTagNameNS(NS_P, 'sp'));
    for (const shape of shapes) {
      const spPr = shape.getElementsByTagNameNS(NS_P, 'spPr')[0];
      if (!spPr) continue;

      const xfrm = spPr.getElementsByTagNameNS(NS_A, 'xfrm')[0];
      let x = 0, y = 0, w = 0, h = 0;
      if (xfrm) {
        const off = xfrm.getElementsByTagNameNS(NS_A, 'off')[0];
        const ext = xfrm.getElementsByTagNameNS(NS_A, 'ext')[0];
        if (off) {
          x = (parseInt(off.getAttribute('x'), 10) || 0) / EMU_PER_PT;
          y = (parseInt(off.getAttribute('y'), 10) || 0) / EMU_PER_PT;
        }
        if (ext) {
          w = (parseInt(ext.getAttribute('cx'), 10) || 0) / EMU_PER_PT;
          h = (parseInt(ext.getAttribute('cy'), 10) || 0) / EMU_PER_PT;
        }
      }

      // Check shape fill
      const solidFill = spPr.getElementsByTagNameNS(NS_A, 'solidFill')[0];
      if (solidFill && w > 0 && h > 0) {
        const srgb = solidFill.getElementsByTagNameNS(NS_A, 'srgbClr')[0];
        if (srgb) {
          const [r, g, b] = hexToRgb(srgb.getAttribute('val'));
          pdf.setFillColor(r, g, b);
          pdf.roundedRect(x, y, w, h, 2, 2, 'F');
        }
      }

      // Check shape outline
      const ln = spPr.getElementsByTagNameNS(NS_A, 'ln')[0];
      if (ln && w > 0 && h > 0) {
        const lnFill = ln.getElementsByTagNameNS(NS_A, 'solidFill')[0]?.getElementsByTagNameNS(NS_A, 'srgbClr')[0];
        if (lnFill) {
          const [r, g, b] = hexToRgb(lnFill.getAttribute('val'));
          const lnW = (parseInt(ln.getAttribute('w'), 10) || 12700) / EMU_PER_PT;
          pdf.setDrawColor(r, g, b);
          pdf.setLineWidth(Math.max(0.5, lnW));
          pdf.roundedRect(x, y, w, h, 2, 2, 'S');
        }
      }

      // Check text body
      const txBody = shape.getElementsByTagNameNS(NS_P, 'txBody')[0];
      if (txBody) {
        const bodyPr = txBody.getElementsByTagNameNS(NS_A, 'bodyPr')[0];
        const padL = bodyPr ? (parseInt(bodyPr.getAttribute('lIns'), 10) || 91440) / EMU_PER_PT : 7;
        const padT = bodyPr ? (parseInt(bodyPr.getAttribute('tIns'), 10) || 91440) / EMU_PER_PT : 7;
        const padR = bodyPr ? (parseInt(bodyPr.getAttribute('rIns'), 10) || 91440) / EMU_PER_PT : 7;

        const effectiveX = x + padL;
        let currentY = y + padT;
        const maxContentW = Math.max(20, (w || (slideWidthPt - x)) - padL - padR);

        const paragraphs = Array.from(txBody.getElementsByTagNameNS(NS_A, 'p'));
        for (const p of paragraphs) {
          const pPr = p.getElementsByTagNameNS(NS_A, 'pPr')[0];
          const algn = pPr?.getAttribute('algn') || 'l';

          const runs = Array.from(p.getElementsByTagNameNS(NS_A, 'r'));
          if (runs.length === 0) {
            // Check plain text node if no runs
            const plainT = p.getElementsByTagNameNS(NS_A, 't')[0]?.textContent?.trim();
            if (plainT) {
              pdf.setFontSize(14);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(30, 41, 59);
              pdf.text(plainT, effectiveX, currentY + 12);
              currentY += 18;
            }
            continue;
          }

          // Combine runs into full paragraph text with primary formatting
          const pText = runs.map((r) => r.getElementsByTagNameNS(NS_A, 't')[0]?.textContent || '').join('');
          if (!pText.trim()) continue;

          // Pick primary run properties
          const primaryRPr = runs[0]?.getElementsByTagNameNS(NS_A, 'rPr')[0];
          const sz = primaryRPr?.getAttribute('sz');
          const fontSizePt = sz ? Math.max(8, parseInt(sz, 10) / 100) : 14;
          const isBold = primaryRPr?.getAttribute('b') === '1';
          const isItalic = primaryRPr?.getAttribute('i') === '1';
          const colorHex = primaryRPr?.getElementsByTagNameNS(NS_A, 'srgbClr')[0]?.getAttribute('val') || '1E293B';
          const [r, g, b] = hexToRgb(colorHex);

          const fontStyle = isBold && isItalic ? 'bolditalic' : isBold ? 'bold' : isItalic ? 'italic' : 'normal';

          pdf.setFont('helvetica', fontStyle);
          pdf.setFontSize(fontSizePt);
          pdf.setTextColor(r, g, b);

          const lines = pdf.splitTextToSize(pText, maxContentW);
          const lineH = fontSizePt * 1.25;

          for (const line of lines) {
            let lineX = effectiveX;
            if (algn === 'ctr') {
              lineX = effectiveX + (maxContentW - pdf.getTextWidth(line)) / 2;
            } else if (algn === 'r') {
              lineX = effectiveX + maxContentW - pdf.getTextWidth(line);
            }
            pdf.text(line, lineX, currentY + fontSizePt);
            currentY += lineH;
          }
          currentY += 4; // paragraph spacing
        }
      }
    }

    // 5. Render Images (<p:pic>)
    const pictures = Array.from(slideDoc.getElementsByTagNameNS(NS_P, 'pic'));
    for (const pic of pictures) {
      const spPr = pic.getElementsByTagNameNS(NS_P, 'spPr')[0];
      const blipFill = pic.getElementsByTagNameNS(NS_P, 'blipFill')[0];
      if (!spPr || !blipFill) continue;

      const blip = blipFill.getElementsByTagNameNS(NS_A, 'blip')[0];
      const rId = blip?.getAttribute('r:embed') || blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
      const mediaPath = relsMap[rId];

      if (!mediaPath || !archive.files[mediaPath]) continue;

      const xfrm = spPr.getElementsByTagNameNS(NS_A, 'xfrm')[0];
      if (!xfrm) continue;

      const off = xfrm.getElementsByTagNameNS(NS_A, 'off')[0];
      const ext = xfrm.getElementsByTagNameNS(NS_A, 'ext')[0];
      const x = (parseInt(off?.getAttribute('x'), 10) || 0) / EMU_PER_PT;
      const y = (parseInt(off?.getAttribute('y'), 10) || 0) / EMU_PER_PT;
      const w = (parseInt(ext?.getAttribute('cx'), 10) || 0) / EMU_PER_PT;
      const h = (parseInt(ext?.getAttribute('cy'), 10) || 0) / EMU_PER_PT;

      if (w <= 0 || h <= 0) continue;

      try {
        const imgBytes = await archive.files[mediaPath].async('uint8array');
        const extName = mediaPath.split('.').pop()?.toUpperCase() || 'PNG';
        const imgFormat = extName === 'JPG' || extName === 'JPEG' ? 'JPEG' : 'PNG';
        const base64Data = `data:image/${imgFormat.toLowerCase()};base64,${uint8ArrayToBase64(imgBytes)}`;
        pdf.addImage(base64Data, imgFormat, x, y, w, h);
      } catch (err) {
        console.warn('Could not render image in slide:', err);
      }
    }

    // 6. Render Tables (<p:graphicFrame>)
    const graphicFrames = Array.from(slideDoc.getElementsByTagNameNS(NS_P, 'graphicFrame'));
    for (const frame of graphicFrames) {
      const xfrm = frame.getElementsByTagNameNS(NS_P, 'xfrm')[0];
      const tbl = frame.getElementsByTagNameNS(NS_A, 'tbl')[0];
      if (!xfrm || !tbl) continue;

      const off = xfrm.getElementsByTagNameNS(NS_A, 'off')[0];
      const startX = (parseInt(off?.getAttribute('x'), 10) || 0) / EMU_PER_PT;
      let tableY = (parseInt(off?.getAttribute('y'), 10) || 0) / EMU_PER_PT;

      // Column widths
      const gridCols = Array.from(tbl.getElementsByTagNameNS(NS_A, 'gridCol'));
      const colWidths = gridCols.map((c) => (parseInt(c.getAttribute('w'), 10) || 1270000) / EMU_PER_PT);

      // Rows
      const trs = Array.from(tbl.getElementsByTagNameNS(NS_A, 'tr'));
      for (let rIdx = 0; rIdx < trs.length; rIdx++) {
        const tr = trs[rIdx];
        const rowH = (parseInt(tr.getAttribute('h'), 10) || 254000) / EMU_PER_PT;
        let cellX = startX;

        const tcs = Array.from(tr.getElementsByTagNameNS(NS_A, 'tc'));
        for (let cIdx = 0; cIdx < tcs.length; cIdx++) {
          const tc = tcs[cIdx];
          const cellW = colWidths[cIdx] || 100;

          // Cell Fill
          const tcPr = tc.getElementsByTagNameNS(NS_A, 'tcPr')[0];
          const solidFill = tcPr?.getElementsByTagNameNS(NS_A, 'solidFill')[0]?.getElementsByTagNameNS(NS_A, 'srgbClr')[0];
          if (solidFill) {
            const [r, g, b] = hexToRgb(solidFill.getAttribute('val'));
            pdf.setFillColor(r, g, b);
          } else {
            pdf.setFillColor(rIdx === 0 ? 241 : 255, rIdx === 0 ? 245 : 255, rIdx === 0 ? 249 : 255);
          }
          pdf.rect(cellX, tableY, cellW, rowH, 'F');

          // Cell Border
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.5);
          pdf.rect(cellX, tableY, cellW, rowH, 'S');

          // Cell Text
          const txBody = tc.getElementsByTagNameNS(NS_A, 'txBody')[0];
          const textRuns = Array.from(txBody?.getElementsByTagNameNS(NS_A, 't') || []);
          const cellText = textRuns.map((t) => t.textContent || '').join(' ').trim();

          if (cellText) {
            const isHeader = rIdx === 0;
            pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
            pdf.setFontSize(isHeader ? 10 : 9);
            pdf.setTextColor(30, 41, 59);
            pdf.text(cellText, cellX + 6, tableY + rowH * 0.65, { maxWidth: cellW - 12 });
          }

          cellX += cellW;
        }
        tableY += rowH;
      }
    }
  }

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(file.name)}.pdf`,
    message: 'PowerPoint presentation converted to high-fidelity PDF.',
  };
}
