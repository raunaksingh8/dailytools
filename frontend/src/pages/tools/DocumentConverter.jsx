import React, { useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { Download, FileCheck2, LoaderCircle, UploadCloud, X } from 'lucide-react';
import ToolLayout from '../../components/ToolLayout';
import { useToast } from '../../components/Toast';
import { tools } from '../../data/tools';
import { downloadBlob } from '../../utils/downloadFile';
import { convertPdfToWord } from '../../utils/converters/pdfToWord';
import { convertWordToPdf } from '../../utils/converters/wordToPdf';
import { convertPdfToExcel } from '../../utils/converters/pdfToExcel';
import { convertExcelToPdf } from '../../utils/converters/excelToPdf';
import { convertPdfToPowerPoint } from '../../utils/converters/pdfToPowerPoint';
import { convertPowerPointToPdf } from '../../utils/converters/powerPointToPdf';
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
    inputDescription: 'PDF text, headings, and tables will be converted into an editable DOCX document.',
    actionLabel: 'Convert to Word',
    outputLabel: 'Word document',
    extensions: ['pdf'],
  },
  'word-to-pdf': {
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    inputLabel: 'Select a Word document',
    inputDescription: 'DOCX styles, margins, headings, tables, and images will be formatted into a PDF.',
    actionLabel: 'Convert to PDF',
    outputLabel: 'PDF document',
    extensions: ['docx'],
  },
  'pdf-to-excel': {
    accept: '.pdf,application/pdf',
    inputLabel: 'Select a PDF file',
    inputDescription: 'PDF tables, rows, numbers, and currencies will be reconstructed into an Excel workbook.',
    actionLabel: 'Convert to Excel',
    outputLabel: 'Excel workbook',
    extensions: ['pdf'],
  },
  'excel-to-pdf': {
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    inputLabel: 'Select an Excel workbook',
    inputDescription: 'Each worksheet will be formatted into a PDF table with intelligent pagination and orientation.',
    actionLabel: 'Convert to PDF',
    outputLabel: 'PDF document',
    extensions: ['xlsx', 'xls'],
  },
  'pdf-to-powerpoint': {
    accept: '.pdf,application/pdf',
    inputLabel: 'Select a PDF file',
    inputDescription: 'Each PDF page will become a structured, editable PowerPoint slide.',
    actionLabel: 'Convert to PowerPoint',
    outputLabel: 'PowerPoint presentation',
    extensions: ['pdf'],
  },
  'powerpoint-to-pdf': {
    accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    inputLabel: 'Select a PowerPoint presentation',
    inputDescription: 'Slides, text, shapes, colors, images, and tables are exported into a matching PDF.',
    actionLabel: 'Convert to PDF',
    outputLabel: 'PDF document',
    extensions: ['pptx'],
  },
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const getExtension = (fileName) => fileName.split('.').pop()?.toLowerCase() || '';

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
