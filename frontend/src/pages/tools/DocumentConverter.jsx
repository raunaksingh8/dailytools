import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import { Download, FileCheck2, LoaderCircle, UploadCloud, X } from 'lucide-react';
import ToolLayout from '../../components/ToolLayout';
import { useToast } from '../../components/Toast';
import { tools } from '../../data/tools';
import { downloadBlob } from '../../utils/downloadFile';
import { convertPdfToWord } from './pdfToWordConversion';
import '../../styles/file-upload.css';
import '../../styles/document-converter.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// ---------------------------------------------------------------------------
// Converter metadata
// ---------------------------------------------------------------------------
const converterDetails = {
  'pdf-to-word': {
    accept: '.pdf,application/pdf',
    inputLabel: 'Select a PDF file',
    inputDescription: 'PDF text will be placed into an editable DOCX document.',
    actionLabel: 'Convert to Word',
    outputLabel: 'Word document',
    extensions: ['pdf'],
  },
  'word-to-pdf': {
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    inputLabel: 'Select a Word document',
    inputDescription: 'DOCX headings, paragraphs, and tables will be formatted into a PDF.',
    actionLabel: 'Convert to PDF',
    outputLabel: 'PDF document',
    extensions: ['docx'],
  },
  'pdf-to-excel': {
    accept: '.pdf,application/pdf',
    inputLabel: 'Select a PDF file',
    inputDescription: 'Each PDF page becomes a separate Excel sheet with structured rows.',
    actionLabel: 'Convert to Excel',
    outputLabel: 'Excel workbook',
    extensions: ['pdf'],
  },
  'excel-to-pdf': {
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    inputLabel: 'Select an Excel workbook',
    inputDescription: 'Each worksheet will be included as a formatted PDF table.',
    actionLabel: 'Convert to PDF',
    outputLabel: 'PDF document',
    extensions: ['xlsx', 'xls'],
  },
  'pdf-to-powerpoint': {
    accept: '.pdf,application/pdf',
    inputLabel: 'Select a PDF file',
    inputDescription: 'Each PDF page becomes an editable PowerPoint slide.',
    actionLabel: 'Convert to PowerPoint',
    outputLabel: 'PowerPoint presentation',
    extensions: ['pdf'],
  },
  'powerpoint-to-pdf': {
    accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    inputLabel: 'Select a PowerPoint presentation',
    inputDescription: 'Slide text is exported into a clean, printable PDF.',
    actionLabel: 'Convert to PDF',
    outputLabel: 'PDF document',
    extensions: ['pptx'],
  },
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'document';
const getExtension = (fileName) => fileName.split('.').pop()?.toLowerCase() || '';

// ---------------------------------------------------------------------------
// PDF text extraction (used by PDF → Excel and PDF → PowerPoint)
// ---------------------------------------------------------------------------

/**
 * Extract text items with position data from each PDF page.
 * Returns an array of page objects with lines grouped by baseline.
 */
async function extractPdfPages(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    // Group items by baseline to reconstruct lines
    const candidates = content.items
      .filter((item) => item.str && item.str.trim())
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5], // baseline in PDF coords (bottom-up)
        width: item.width || 0,
        height: Math.max(
          item.height || 0,
          Math.hypot(item.transform[2], item.transform[3]) || 10
        ),
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    // Cluster into lines
    const lineGroups = [];
    for (const item of candidates) {
      const existing = lineGroups.find((l) => Math.abs(l.y - item.y) <= Math.max(2, item.height * 0.3));
      if (existing) {
        existing.items.push(item);
      } else {
        lineGroups.push({ y: item.y, items: [item] });
      }
    }

    // Build lines sorted top-to-bottom, items sorted left-to-right
    const lines = lineGroups
      .sort((a, b) => b.y - a.y)
      .map((lg) => ({
        items: lg.items.sort((a, b) => a.x - b.x),
        text: lg.items.sort((a, b) => a.x - b.x).map((i) => i.text).join(' ').trim(),
      }))
      .filter((l) => l.text);

    const fullText = lines.map((l) => l.text).join('\n').trim();
    pages.push({ lines, fullText: fullText || 'No selectable text found on this page.' });
  }

  return pages;
}

// ---------------------------------------------------------------------------
// 1. Word → PDF
//    Uses mammoth to convert DOCX → HTML, then renders each HTML element into
//    jsPDF with appropriate font sizes for headings/paragraphs.
// ---------------------------------------------------------------------------
async function convertWordToPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const MARGIN = 56.7; // 2 cm
  const PAGE_W = pdf.internal.pageSize.getWidth();
  const PAGE_H = pdf.internal.pageSize.getHeight();
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  const headingFontSize = { h1: 20, h2: 16, h3: 14, h4: 13, h5: 12, h6: 11 };
  const BODY_FONT_SIZE = 11;
  const LINE_HEIGHT = 1.4;

  function ensureSpace(needed) {
    if (y + needed > PAGE_H - MARGIN) {
      pdf.addPage();
      y = MARGIN;
    }
  }

  function renderText(text, fontSize, bold = false, afterSpacing = 8) {
    if (!text.trim()) return;
    // jsPDF doesn't support real bold via setFont in the default font;
    // we simulate bold by a slightly larger size increment instead.
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text.trim(), CONTENT_W);
    const lineH = fontSize * LINE_HEIGHT;
    ensureSpace(lineH * lines.length);
    for (const line of lines) {
      ensureSpace(lineH);
      pdf.text(line, MARGIN, y);
      y += lineH;
    }
    y += afterSpacing;
  }

  // Parse the HTML using DOMParser (browser-only API)
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const walker = document.createTreeWalker
    ? null
    : null;

  // Process each top-level element in order
  const processNode = (node) => {
    const tag = node.nodeName.toLowerCase();
    const text = node.textContent?.trim() || '';

    if (!text && tag !== 'table') return;

    if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1], 10);
      const fs = headingFontSize[tag] || 12;
      const spacing = level <= 2 ? 12 : 8;
      ensureSpace(fs * LINE_HEIGHT * 2);
      if (level <= 2) y += 6; // extra top margin for major headings
      renderText(text, fs, true, spacing);
    } else if (tag === 'p' || tag === 'li') {
      const prefix = tag === 'li' ? '  • ' : '';
      renderText(prefix + text, BODY_FONT_SIZE, false, 4);
    } else if (tag === 'table') {
      // Render table using autoTable
      const tableRows = Array.from(node.querySelectorAll('tr')).map((tr) =>
        Array.from(tr.querySelectorAll('td,th')).map((cell) => cell.textContent?.trim() || '')
      );
      if (tableRows.length > 0) {
        ensureSpace(40);
        autoTable(pdf, {
          startY: y,
          head: [tableRows[0]],
          body: tableRows.slice(1),
          margin: { left: MARGIN, right: MARGIN },
          styles: { fontSize: 9, cellPadding: 4, lineColor: [180, 180, 180], lineWidth: 0.5 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          theme: 'grid',
        });
        y = pdf.lastAutoTable.finalY + 12;
      }
    } else if (tag === 'ul' || tag === 'ol') {
      for (const child of node.children) processNode(child);
    } else if (tag === 'blockquote') {
      const indent = MARGIN + 12;
      pdf.setFontSize(BODY_FONT_SIZE);
      const lines = pdf.splitTextToSize(text, CONTENT_W - 12);
      const lineH = BODY_FONT_SIZE * LINE_HEIGHT;
      for (const line of lines) {
        ensureSpace(lineH);
        pdf.text(line, indent, y);
        y += lineH;
      }
      y += 6;
    }
  };

  const body = dom.body;
  for (const child of body.children) {
    processNode(child);
  }

  // Warn about messages from mammoth (e.g. unsupported elements)
  let message = 'Conversion complete.';
  if (result.messages && result.messages.length > 0) {
    const warnings = result.messages.filter((m) => m.type === 'warning').length;
    if (warnings > 0) message = `Converted with ${warnings} warning(s). Some elements may not have been fully rendered.`;
  }

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(file.name)}.pdf`,
    message,
  };
}

// ---------------------------------------------------------------------------
// 2. PDF → Excel
//    Each PDF page becomes a separate sheet. Lines from the page are placed
//    into rows; tab-separated or multi-space-separated columns are split.
// ---------------------------------------------------------------------------
async function convertPdfToExcel(file) {
  const pages = await extractPdfPages(file);
  const workbook = XLSX.utils.book_new();

  pages.forEach((pageData, index) => {
    const sheetName = `Page ${index + 1}`;

    if (pageData.fullText === 'No selectable text found on this page.') {
      const ws = XLSX.utils.aoa_to_sheet([['(No selectable text on this page)']]);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      return;
    }

    // Try to detect column-aligned text using position data
    const rows = pageData.lines.map((line) => {
      // If a line has multiple items with significant x gaps, treat them as columns
      if (line.items.length > 1) {
        const cols = [];
        let currentCol = line.items[0].text;
        for (let i = 1; i < line.items.length; i++) {
          const gap = line.items[i].x - (line.items[i - 1].x + line.items[i - 1].width);
          if (gap > 10) {
            cols.push(currentCol.trim());
            currentCol = line.items[i].text;
          } else {
            currentCol += (gap > 2 ? ' ' : '') + line.items[i].text;
          }
        }
        cols.push(currentCol.trim());
        return cols;
      }
      // Single item: try splitting by multiple spaces or tabs
      const text = line.text;
      const parts = text.split(/\t|\s{2,}/).map((p) => p.trim()).filter(Boolean);
      return parts.length > 1 ? parts : [text];
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Auto-width columns
    const maxCols = Math.max(...rows.map((r) => r.length), 1);
    ws['!cols'] = Array.from({ length: maxCols }, (_, ci) => ({
      wch: Math.min(50, Math.max(10, ...rows.map((r) => String(r[ci] || '').length))),
    }));

    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  });

  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  return {
    blob: new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    fileName: `${fileStem(file.name)}.xlsx`,
  };
}

// ---------------------------------------------------------------------------
// 3. Excel → PDF
//    Each sheet is rendered as a formatted table using jsPDF autoTable.
// ---------------------------------------------------------------------------
async function convertExcelToPdf(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

  workbook.SheetNames.forEach((sheetName, index) => {
    if (index > 0) pdf.addPage();
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });

    pdf.setFontSize(14);
    pdf.text(sheetName, 42, 36);

    if (!rows.length) {
      pdf.setFontSize(10);
      pdf.text('(No data in this sheet)', 42, 60);
      return;
    }

    const [head, ...body] = rows;
    const headRow = head.map(String);
    const bodyRows = body.map((row) => row.map((cell) => String(cell)));

    autoTable(pdf, {
      startY: 52,
      head: [headRow],
      body: bodyRows,
      margin: { left: 42, right: 42 },
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      theme: 'grid',
    });
  });

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(file.name)}.pdf`,
  };
}

// ---------------------------------------------------------------------------
// 4. PDF → PowerPoint
//    Each PDF page becomes a slide. The first non-empty line of the page is
//    used as the slide title; the rest becomes the body text.
// ---------------------------------------------------------------------------
async function convertPdfToPowerPoint(file) {
  const pages = await extractPdfPages(file);
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'DailyTools';
  pres.subject = 'PDF conversion';

  pages.forEach((pageData, index) => {
    const slide = pres.addSlide();
    slide.background = { color: 'FFFFFF' };

    const lines = pageData.lines.map((l) => l.text).filter(Boolean);
    const titleText = lines[0] || `Page ${index + 1}`;
    const bodyText = lines.slice(1).join('\n') || pageData.fullText;

    // Title
    slide.addText(titleText, {
      x: 0.4,
      y: 0.2,
      w: 12.5,
      h: 0.6,
      fontSize: 20,
      bold: true,
      color: '1E3A5F',
      wrap: true,
    });

    // Body
    if (bodyText.trim()) {
      slide.addText(bodyText, {
        x: 0.4,
        y: 1.0,
        w: 12.5,
        h: 6.0,
        fontSize: 11,
        color: '263238',
        valign: 'top',
        wrap: true,
        fit: 'shrink',
      });
    }

    // Slide number
    slide.addText(`${index + 1}`, {
      x: 12.5,
      y: 7.0,
      w: 0.5,
      h: 0.3,
      fontSize: 9,
      color: 'AAAAAA',
      align: 'right',
    });
  });

  return {
    blob: await pres.write({ outputType: 'blob' }),
    fileName: `${fileStem(file.name)}.pptx`,
  };
}

// ---------------------------------------------------------------------------
// 5. PowerPoint → PDF
//    Extracts text from each slide XML and renders it into jsPDF.
// ---------------------------------------------------------------------------
async function extractPowerPointSlides(file) {
  const archive = await JSZip.loadAsync(await file.arrayBuffer());
  const slidePaths = Object.keys(archive.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort(
      (a, b) =>
        Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1])
    );

  if (!slidePaths.length) {
    throw new Error('This presentation does not contain readable slides.');
  }

  return Promise.all(
    slidePaths.map(async (path) => {
      const xml = await archive.files[path].async('text');
      const parsed = new DOMParser().parseFromString(xml, 'application/xml');

      // Get all <a:t> text nodes in document order
      const textNodes = Array.from(
        parsed.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't')
      );
      const texts = textNodes.map((el) => el.textContent || '').filter(Boolean);

      // Attempt to identify the title: typically the first text run that belongs
      // to a title/cSld sp with idx="0" — we just use the first non-empty run.
      const title = texts[0] || '';
      const body = texts.slice(1).join('\n');

      return { title, body, all: texts.join(' ') || 'No selectable text found on this slide.' };
    })
  );
}

async function convertPowerPointToPdf(file) {
  const slides = await extractPowerPointSlides(file);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const MARGIN = 56.7;
  const PAGE_W = pdf.internal.pageSize.getWidth();
  const PAGE_H = pdf.internal.pageSize.getHeight();
  const CONTENT_W = PAGE_W - MARGIN * 2;

  slides.forEach(({ title, body }, index) => {
    if (index > 0) pdf.addPage();
    let y = MARGIN;

    // Slide header bar
    pdf.setFillColor(30, 58, 95);
    pdf.rect(0, 0, PAGE_W, 36, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text(`Slide ${index + 1}`, MARGIN, 23);
    pdf.setTextColor(0, 0, 0);

    y = 56;

    // Title
    if (title.trim()) {
      pdf.setFontSize(16);
      const titleLines = pdf.splitTextToSize(title.trim(), CONTENT_W);
      titleLines.forEach((line) => {
        pdf.text(line, MARGIN, y);
        y += 16 * 1.4;
      });
      y += 8;
    }

    // Separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 12;

    // Body
    if (body.trim()) {
      pdf.setFontSize(10.5);
      const bodyLines = pdf.splitTextToSize(body.trim(), CONTENT_W);
      const lineH = 10.5 * 1.4;
      bodyLines.forEach((line) => {
        if (y + lineH > PAGE_H - MARGIN) {
          pdf.addPage();
          y = MARGIN;
        }
        pdf.text(line, MARGIN, y);
        y += lineH;
      });
    }
  });

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(file.name)}.pdf`,
  };
}

// ---------------------------------------------------------------------------
// Converter dispatch table
// ---------------------------------------------------------------------------
const converters = {
  'pdf-to-word': convertPdfToWord,
  'word-to-pdf': convertWordToPdf,
  'pdf-to-excel': convertPdfToExcel,
  'excel-to-pdf': convertExcelToPdf,
  'pdf-to-powerpoint': convertPdfToPowerPoint,
  'powerpoint-to-pdf': convertPowerPointToPdf,
};

// ---------------------------------------------------------------------------
// React component (unchanged UI)
// ---------------------------------------------------------------------------
const DocumentConverter = ({ converter }) => {
  const details = converterDetails[converter];
  const tool = tools.find((item) => item.slug === converter);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const inputRef = useRef(null);
  const toast = useToast();

  const selectFile = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!details.extensions.includes(getExtension(selectedFile.name))) {
      toast(`Please select a ${details.extensions.map((ext) => ext.toUpperCase()).join(' or ')} file.`, 'info');
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const convert = async () => {
    if (!file) return;
    setIsConverting(true);
    setResult(null);

    try {
      const output = await converters[converter](file);
      setResult(output);
      toast(output.message || 'Conversion complete.', 'success');
    } catch (error) {
      console.error('Conversion error:', error);
      toast(`Conversion failed: ${error.message || 'Please try another file.'}`, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  const download = () => {
    if (!result || !downloadBlob(result.blob, result.fileName)) {
      toast('The converted file could not be downloaded. Please convert it again.', 'error');
    }
  };

  return (
    <ToolLayout
      tool={tool}
      about={`${tool.description}. Files are processed locally in your browser and are not uploaded to a server.`}
      relatedTools={Object.keys(converterDetails).filter((slug) => slug !== converter)}
    >
      <div className="tool-section-layout document-converter-layout">
        <div className="file-upload-zone document-converter-upload">
          <input
            ref={inputRef}
            type="file"
            accept={details.accept}
            onChange={selectFile}
            className="file-upload-input"
            aria-label={details.inputLabel}
          />
          <UploadCloud size={42} className="file-upload-icon" />
          <h3 className="file-upload-title">{file ? 'Choose a different file' : details.inputLabel}</h3>
          <p className="text-secondary file-upload-desc">{details.inputDescription}</p>
        </div>

        {file && (
          <div className="file-list-container document-converter-file">
            <div className="file-list-item">
              <div className="document-converter-file-name">
                <FileCheck2 size={18} />
                <span>{file.name}</span>
              </div>
              <span className="text-secondary file-list-size">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
            <div className="file-actions-row">
              <button className="btn-primary btn-icon-label" onClick={convert} disabled={isConverting}>
                {isConverting ? <LoaderCircle size={16} className="document-converter-spinner" /> : null}
                {isConverting ? 'Converting...' : details.actionLabel}
              </button>
              <button className="btn-secondary btn-icon-label" onClick={clearFile} disabled={isConverting}>
                <X size={16} /> Clear
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="tool-success-alert document-converter-success">
            <span className="tool-success-text">Your {details.outputLabel} is ready.</span>
            <button className="btn-primary btn-icon-label" onClick={download}>
              <Download size={16} /> Download
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default DocumentConverter;
