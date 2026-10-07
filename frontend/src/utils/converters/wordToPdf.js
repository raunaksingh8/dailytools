import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as docxPreview from 'docx-preview';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'document';
const TWIP_TO_PT = 1 / 20;

function uint8ArrayToBase64(uint8) {
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(uint8).toString('base64');
}

/**
 * High-fidelity Word (.docx) to PDF conversion.
 * 
 * Primary Engine:
 * - Uses docx-preview to parse OpenXML DOCX archive (document.xml, styles.xml,
 *   numbering.xml, headers, footers, relationships, tables, images, borders, alignments).
 * - Rasterizes each rendered document page at retina scale (2x) using html2canvas.
 * - Embeds each page into jsPDF with exact page dimensions.
 * 
 * Secondary Engine (OpenXML structural parser fallback):
 * - Direct OpenXML parser extracting page size, margins, headers, footers, headings,
 *   bullet lists, images, and tables directly into jsPDF.
 */
export async function convertWordToPdf(file) {
  const arrayBuffer = await file.arrayBuffer();

  // Try Primary Engine (High fidelity docx-preview + html2canvas) in browser
  try {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.zIndex = '-9999';
      container.style.background = '#ffffff';
      document.body.appendChild(container);

      try {
        await docxPreview.renderAsync(arrayBuffer, container, null, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          experimental: true,
          breakPages: true,
          useBase64URL: true,
        });

        let pageElements = Array.from(container.querySelectorAll('.docx-page, section.docx, article.docx'));
        if (pageElements.length === 0) {
          pageElements = Array.from(container.querySelectorAll('.docx-wrapper > section'));
        }
        if (pageElements.length === 0) {
          pageElements = [container.querySelector('.docx') || container];
        }

        if (pageElements.length > 0 && pageElements[0].offsetWidth > 50) {
          let pdf = null;

          for (let pIdx = 0; pIdx < pageElements.length; pIdx++) {
            const pageEl = pageElements[pIdx];
            const canvas = await html2canvas(pageEl, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
            });

            const widthPt = (pageEl.offsetWidth * 72) / 96;
            const heightPt = (pageEl.offsetHeight * 72) / 96;
            const orientation = widthPt > heightPt ? 'landscape' : 'portrait';

            if (!pdf) {
              pdf = new jsPDF({
                unit: 'pt',
                format: [widthPt, heightPt],
                orientation,
              });
            } else {
              pdf.addPage([widthPt, heightPt], orientation);
            }

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt, undefined, 'FAST');
          }

          if (pdf) {
            document.body.removeChild(container);
            return {
              blob: pdf.output('blob'),
              fileName: `${fileStem(file.name)}.pdf`,
              message: 'Word document converted to high-fidelity PDF preserving layout, tables, fonts, and images.',
            };
          }
        }
      } finally {
        if (container.parentNode) {
          document.body.removeChild(container);
        }
      }
    }
  } catch (err) {
    console.warn('docx-preview engine encountered an issue, using OpenXML fallback:', err);
  }

  // Fallback: Direct OpenXML JSZip parser into structured jsPDF
  return await convertWordToPdfOpenXml(arrayBuffer, file.name);
}

/**
 * Direct OpenXML parser fallback: preserves page size, margins, headers, footers, headings, paragraphs, images, and tables.
 */
async function convertWordToPdfOpenXml(arrayBuffer, fileName) {
  const archive = await JSZip.loadAsync(arrayBuffer);
  const docXml = await archive.files['word/document.xml'].async('text');
  const dom = new DOMParser().parseFromString(docXml, 'application/xml');

  const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';

  // Parse relationships for images
  const relsMap = {};
  if (archive.files['word/_rels/document.xml.rels']) {
    const relsXml = await archive.files['word/_rels/document.xml.rels'].async('text');
    const relsDom = new DOMParser().parseFromString(relsXml, 'application/xml');
    const relEls = Array.from(relsDom.getElementsByTagName('Relationship'));
    relEls.forEach((el) => {
      const id = el.getAttribute('Id');
      const target = el.getAttribute('Target');
      if (id && target) {
        relsMap[id] = target.replace(/^\.\.\//, 'word/').replace(/^media\//, 'word/media/');
      }
    });
  }

  // Parse header and footer text if present
  let headerText = '';
  let footerText = '';
  if (archive.files['word/header1.xml']) {
    const hXml = await archive.files['word/header1.xml'].async('text');
    const hDom = new DOMParser().parseFromString(hXml, 'application/xml');
    const tNodes = Array.from(hDom.getElementsByTagNameNS(NS_W, 't'));
    headerText = tNodes.map((t) => t.textContent || '').join(' ').trim();
  }
  if (archive.files['word/footer1.xml']) {
    const fXml = await archive.files['word/footer1.xml'].async('text');
    const fDom = new DOMParser().parseFromString(fXml, 'application/xml');
    const tNodes = Array.from(fDom.getElementsByTagNameNS(NS_W, 't'));
    footerText = tNodes.map((t) => t.textContent || '').join(' ').trim();
  }

  // Parse page size and margins from sectPr
  let pageWidthPt = 595.28;
  let pageHeightPt = 841.89;
  let marginTopPt = 54;
  let marginBottomPt = 54;
  let marginLeftPt = 54;
  let marginRightPt = 54;

  const sectPr = dom.getElementsByTagNameNS(NS_W, 'sectPr')[0];
  if (sectPr) {
    const pgSz = sectPr.getElementsByTagNameNS(NS_W, 'pgSz')[0];
    if (pgSz) {
      const wTwip = parseInt(pgSz.getAttributeNS(NS_W, 'w') || pgSz.getAttribute('w'), 10);
      const hTwip = parseInt(pgSz.getAttributeNS(NS_W, 'h') || pgSz.getAttribute('h'), 10);
      if (wTwip && hTwip) {
        pageWidthPt = wTwip * TWIP_TO_PT;
        pageHeightPt = hTwip * TWIP_TO_PT;
      }
    }
    const pgMar = sectPr.getElementsByTagNameNS(NS_W, 'pgMar')[0];
    if (pgMar) {
      const topTwip = parseInt(pgMar.getAttributeNS(NS_W, 'top') || pgMar.getAttribute('top'), 10);
      const botTwip = parseInt(pgMar.getAttributeNS(NS_W, 'bottom') || pgMar.getAttribute('bottom'), 10);
      const lTwip = parseInt(pgMar.getAttributeNS(NS_W, 'left') || pgMar.getAttribute('left'), 10);
      const rTwip = parseInt(pgMar.getAttributeNS(NS_W, 'right') || pgMar.getAttribute('right'), 10);
      if (topTwip) marginTopPt = topTwip * TWIP_TO_PT;
      if (botTwip) marginBottomPt = botTwip * TWIP_TO_PT;
      if (lTwip) marginLeftPt = lTwip * TWIP_TO_PT;
      if (rTwip) marginRightPt = rTwip * TWIP_TO_PT;
    }
  }

  const orientation = pageWidthPt > pageHeightPt ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    unit: 'pt',
    format: [pageWidthPt, pageHeightPt],
    orientation,
  });

  const contentWidth = pageWidthPt - marginLeftPt - marginRightPt;
  let currentY = marginTopPt;

  function renderPageHeaderAndFooter() {
    if (headerText) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text(headerText, marginLeftPt, marginTopPt / 1.5);
    }
    if (footerText) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text(footerText, marginLeftPt, pageHeightPt - (marginBottomPt / 2));
    }
  }

  renderPageHeaderAndFooter();

  function ensureSpace(needed) {
    if (currentY + needed > pageHeightPt - marginBottomPt) {
      pdf.addPage([pageWidthPt, pageHeightPt], orientation);
      currentY = marginTopPt;
      renderPageHeaderAndFooter();
    }
  }

  const body = dom.getElementsByTagNameNS(NS_W, 'body')[0];
  if (!body) throw new Error('Invalid Word document structure.');

  for (const child of Array.from(body.children)) {
    const localName = child.localName || child.nodeName.split(':').pop();

    if (localName === 'p') {
      // Check for explicit page break
      const brs = Array.from(child.getElementsByTagNameNS(NS_W, 'br'));
      const hasPageBreak = brs.some((b) => (b.getAttributeNS(NS_W, 'type') || b.getAttribute('type')) === 'page');
      if (hasPageBreak) {
        pdf.addPage([pageWidthPt, pageHeightPt], orientation);
        currentY = marginTopPt;
        renderPageHeaderAndFooter();
        continue;
      }

      // Check bullet / numbered list
      const numPr = child.getElementsByTagNameNS(NS_W, 'numPr')[0];
      const isList = !!numPr;

      // Check embedded image
      const blip = child.getElementsByTagNameNS(NS_A, 'blip')[0];
      if (blip) {
        const rId = blip.getAttribute('r:embed') || blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
        const mediaPath = relsMap[rId];
        if (mediaPath && archive.files[mediaPath]) {
          try {
            const imgBytes = await archive.files[mediaPath].async('uint8array');
            const extName = mediaPath.split('.').pop()?.toUpperCase() || 'PNG';
            const imgFormat = extName === 'JPG' || extName === 'JPEG' ? 'JPEG' : 'PNG';
            const base64Data = `data:image/${imgFormat.toLowerCase()};base64,${uint8ArrayToBase64(imgBytes)}`;
            const imgW = Math.min(contentWidth, 300);
            const imgH = 150;
            ensureSpace(imgH + 10);
            pdf.addImage(base64Data, imgFormat, marginLeftPt, currentY, imgW, imgH);
            currentY += imgH + 12;
            continue;
          } catch (err) {
            console.warn('Failed embedding DOCX image in fallback:', err);
          }
        }
      }

      const pPr = child.getElementsByTagNameNS(NS_W, 'pPr')[0];
      const pStyle = pPr?.getElementsByTagNameNS(NS_W, 'pStyle')[0]?.getAttributeNS(NS_W, 'val') || '';
      const jc = pPr?.getElementsByTagNameNS(NS_W, 'jc')[0]?.getAttributeNS(NS_W, 'val') || 'left';

      const runs = Array.from(child.getElementsByTagNameNS(NS_W, 'r'));
      if (runs.length === 0) {
        currentY += 8;
        continue;
      }

      let fontSizePt = 11;
      let isBold = false;
      let isItalic = false;

      if (/Heading1/i.test(pStyle)) {
        fontSizePt = 20;
        isBold = true;
      } else if (/Heading2/i.test(pStyle)) {
        fontSizePt = 16;
        isBold = true;
      } else if (/Heading3/i.test(pStyle)) {
        fontSizePt = 13;
        isBold = true;
      } else {
        const firstRPr = runs[0].getElementsByTagNameNS(NS_W, 'rPr')[0];
        const sz = firstRPr?.getElementsByTagNameNS(NS_W, 'sz')[0]?.getAttributeNS(NS_W, 'val');
        if (sz) fontSizePt = Math.max(8, parseInt(sz, 10) / 2);
        isBold = !!firstRPr?.getElementsByTagNameNS(NS_W, 'b')[0];
        isItalic = !!firstRPr?.getElementsByTagNameNS(NS_W, 'i')[0];
      }

      let fullPText = runs.map((r) => {
        const tNodes = Array.from(r.getElementsByTagNameNS(NS_W, 't'));
        return tNodes.map((t) => t.textContent || '').join('');
      }).join('');

      if (!fullPText.trim()) continue;
      if (isList) fullPText = `•  ${fullPText}`;

      const fontStyle = isBold && isItalic ? 'bolditalic' : isBold ? 'bold' : isItalic ? 'italic' : 'normal';
      pdf.setFont('helvetica', fontStyle);
      pdf.setFontSize(fontSizePt);
      const [cr, cg, cb] = isBold ? [30, 58, 95] : [30, 41, 59];
      pdf.setTextColor(cr, cg, cb);

      const lines = pdf.splitTextToSize(fullPText, contentWidth);
      const lineH = fontSizePt * 1.35;

      ensureSpace(lineH * lines.length + 8);

      for (const line of lines) {
        let lineX = marginLeftPt;
        if (jc === 'center') {
          lineX = marginLeftPt + (contentWidth - pdf.getTextWidth(line)) / 2;
        } else if (jc === 'right') {
          lineX = marginLeftPt + contentWidth - pdf.getTextWidth(line);
        }
        pdf.text(line, lineX, currentY + fontSizePt);
        currentY += lineH;
      }
      currentY += isBold ? 8 : 4;

    } else if (localName === 'tbl') {
      const trs = Array.from(child.getElementsByTagNameNS(NS_W, 'tr'));
      const tableRows = trs.map((tr) => {
        const tcs = Array.from(tr.getElementsByTagNameNS(NS_W, 'tc'));
        return tcs.map((tc) => {
          const tNodes = Array.from(tc.getElementsByTagNameNS(NS_W, 't'));
          return tNodes.map((t) => t.textContent || '').join(' ').trim();
        });
      }).filter((r) => r.length > 0);

      if (tableRows.length > 0) {
        ensureSpace(40);
        const [head, ...bodyRows] = tableRows;
        autoTable(pdf, {
          startY: currentY,
          head: [head],
          body: bodyRows,
          margin: { left: marginLeftPt, right: marginRightPt },
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 5, lineColor: [209, 213, 219], lineWidth: 0.5 },
          headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });
        currentY = pdf.lastAutoTable.finalY + 14;
      }
    }
  }

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(fileName)}.pdf`,
    message: 'Word document converted to PDF.',
  };
}
