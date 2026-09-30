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
    inputDescription: 'DOCX text and headings will be formatted into a PDF.',
    actionLabel: 'Convert to PDF',
    outputLabel: 'PDF document',
    extensions: ['docx'],
  },
  'pdf-to-excel': {
    accept: '.pdf,application/pdf',
    inputLabel: 'Select a PDF file',
    inputDescription: 'Extracted text is organized by page in an XLSX workbook.',
    actionLabel: 'Convert to Excel',
    outputLabel: 'Excel workbook',
    extensions: ['pdf'],
  },
  'excel-to-pdf': {
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    inputLabel: 'Select an Excel workbook',
    inputDescription: 'Each worksheet will be included as a readable PDF table.',
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

const fileStem = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'document';

const getExtension = (fileName) => fileName.split('.').pop()?.toLowerCase() || '';

const textForPdf = (text) => text.replace(/\s+/g, ' ').trim() || 'No selectable text was found in this document.';

async function extractPdfPages(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(text || 'No selectable text was found on this page.');
  }

  return pages;
}

function addPdfText(pdf, text, heading) {
  const margin = 42;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const width = pdf.internal.pageSize.getWidth() - (margin * 2);
  let y = margin;

  if (heading) {
    pdf.setFontSize(15);
    pdf.text(heading, margin, y);
    y += 26;
  }

  pdf.setFontSize(10.5);
  const lines = pdf.splitTextToSize(textForPdf(text), width);
  const lineHeight = 15;

  lines.forEach((line) => {
    if (y + lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  });
}

async function convertWordToPdf(file) {
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const html = new DOMParser().parseFromString(result.value, 'text/html');
  const blocks = Array.from(html.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li'));
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

  if (blocks.length) {
    const content = blocks
      .map((block) => block.textContent?.trim())
      .filter(Boolean)
      .join('\n\n');
    addPdfText(pdf, content);
  } else {
    addPdfText(pdf, html.body.textContent || 'No readable text was found in this document.');
  }

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(file.name)}.pdf`,
  };
}

async function convertPdfToExcel(file) {
  const pages = await extractPdfPages(file);
  const workbook = XLSX.utils.book_new();
  const rows = [['Page', 'Extracted text'], ...pages.map((text, index) => [index + 1, text])];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 10 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PDF Text');
  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  return {
    blob: new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    fileName: `${fileStem(file.name)}.xlsx`,
  };
}

async function convertExcelToPdf(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

  workbook.SheetNames.forEach((sheetName, index) => {
    if (index > 0) pdf.addPage();
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
    const normalizedRows = rows.length ? rows : [['No data found in this worksheet.']];
    const [head, ...body] = normalizedRows;
    pdf.setFontSize(14);
    pdf.text(sheetName, 42, 36);
    autoTable(pdf, {
      startY: 52,
      head: [head.map(String)],
      body: body.map((row) => row.map((cell) => String(cell))),
      margin: { left: 42, right: 42 },
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] },
    });
  });

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(file.name)}.pdf`,
  };
}

async function convertPdfToPowerPoint(file) {
  const pages = await extractPdfPages(file);
  const presentation = new PptxGenJS();
  presentation.layout = 'LAYOUT_WIDE';
  presentation.author = 'DailyTools';
  presentation.subject = 'PDF conversion';

  pages.forEach((text, index) => {
    const slide = presentation.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText(`Page ${index + 1}`, { x: 0.5, y: 0.35, w: 12.2, h: 0.35, fontSize: 20, bold: true, color: '1E3A5F' });
    slide.addText(textForPdf(text), {
      x: 0.5,
      y: 0.95,
      w: 12.2,
      h: 5.95,
      fontSize: 12,
      color: '263238',
      breakLine: false,
      fit: 'shrink',
      margin: 0,
      valign: 'top',
    });
  });

  return {
    blob: await presentation.write({ outputType: 'blob' }),
    fileName: `${fileStem(file.name)}.pptx`,
  };
}

async function extractPowerPointSlides(file) {
  const archive = await JSZip.loadAsync(await file.arrayBuffer());
  const slidePaths = Object.keys(archive.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((first, second) => Number(first.match(/slide(\d+)/)?.[1]) - Number(second.match(/slide(\d+)/)?.[1]));

  if (!slidePaths.length) throw new Error('This presentation does not contain readable slides.');

  return Promise.all(slidePaths.map(async (path) => {
    const xml = await archive.files[path].async('text');
    const parsed = new DOMParser().parseFromString(xml, 'application/xml');
    const elements = Array.from(parsed.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't'));
    return elements.map((element) => element.textContent || '').filter(Boolean).join(' ') || 'No selectable text was found on this slide.';
  }));
}

async function convertPowerPointToPdf(file) {
  const slides = await extractPowerPointSlides(file);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

  slides.forEach((text, index) => {
    if (index > 0) pdf.addPage();
    addPdfText(pdf, text, `Slide ${index + 1}`);
  });

  return {
    blob: pdf.output('blob'),
    fileName: `${fileStem(file.name)}.pdf`,
  };
}

const converters = {
  'pdf-to-word': convertPdfToWord,
  'word-to-pdf': convertWordToPdf,
  'pdf-to-excel': convertPdfToExcel,
  'excel-to-pdf': convertExcelToPdf,
  'pdf-to-powerpoint': convertPdfToPowerPoint,
  'powerpoint-to-pdf': convertPowerPointToPdf,
};

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
      toast(`Please select a ${details.extensions.map((extension) => extension.toUpperCase()).join(' or ')} file.`, 'info');
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
      toast(`Conversion failed: ${error.message || 'Please try another file.'}`);
    } finally {
      setIsConverting(false);
    }
  };

  const download = () => {
    if (!result || !downloadBlob(result.blob, result.fileName)) {
      toast('The converted file could not be downloaded. Please convert it again.');
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
