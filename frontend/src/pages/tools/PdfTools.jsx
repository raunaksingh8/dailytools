import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, Download } from 'lucide-react';
import { downloadBlob } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';
import '../../styles/file-upload.css';
import '../../styles/pdf-tools.css';
import '../../styles/pdf-tools.css';

/* ─── PDF Merge ─── */
export const PdfMergeTool = () => {
  const tool = tools.find(t => t.slug === 'pdf-merge');
  const [files, setFiles] = useState([]);
  const [mergedBlob, setMergedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const handleFiles = (e) => {
    if (e.target.files.length) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
      setMergedBlob(null);
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast('Please select at least 2 PDF files to merge.', 'info');
      return;
    }
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      setMergedBlob(new Blob([pdfBytes], { type: 'application/pdf' }));
    } catch (e) {
      toast('Error merging PDFs: ' + e.message);
    }
    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (!mergedBlob) {
      toast('Nothing to download. Please merge some PDFs first.');
      return;
    }
    const ok = downloadBlob(mergedBlob, 'merged.pdf');
    if (!ok) toast('Nothing to download. The merged PDF appears to be empty.');
  };

  const handleClear = () => { setFiles([]); setMergedBlob(null); };

  return (
    <ToolLayout tool={tool}>
      <div className="tool-section-layout">
        {/* Upload area */}
        <div className="file-upload-zone small-padding">
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFiles}
            className="file-upload-input"
            aria-label="Select PDF files to merge"
          />
          <UploadCloud size={32} className="file-upload-icon" />
          <h3 className="file-upload-title">
            {files.length > 0 ? `${files.length} file(s) selected — click to add more` : 'Select PDFs to Merge'}
          </h3>
          <p className="text-secondary file-upload-desc">Click or drag PDF files here</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="file-list-container">
            <h4>Files to Merge ({files.length}):</h4>
            {files.map((f, i) => (
              <div key={i} className="file-list-item">
                <span>{i + 1}. {f.name}</span>
                <span className="text-secondary file-list-size">{(f.size / 1024).toFixed(0)} KB</span>
              </div>
            ))}
            <div className="file-actions-row">
              <button className="btn-primary" onClick={handleMerge} disabled={isProcessing}>
                {isProcessing ? 'Merging…' : 'Merge PDFs'}
              </button>
              {mergedBlob && (
                <button className="btn-primary btn-icon-label" onClick={handleDownload}>
                  <Download size={16} /> Download Merged PDF
                </button>
              )}
              <button className="btn-secondary" onClick={handleClear}>Clear</button>
            </div>
          </div>
        )}

        {/* Success state */}
        {mergedBlob && (
          <div className="tool-success-alert">
            <span className="tool-success-text">✓ Merge complete! {files.length} PDFs merged.</span>
            <button className="btn-primary btn-icon-label" onClick={handleDownload}>
              <Download size={16} /> Download
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

/* ─── PDF Split ─── */
export const PdfSplitTool = () => {
  const tool = tools.find(t => t.slug === 'pdf-split');
  const [file, setFile] = useState(null);
  const [splitBlobs, setSplitBlobs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const handleFile = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setSplitBlobs([]);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const numPages = pdf.getPageCount();
      const blobs = [];
      for (let i = 0; i < numPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        blobs.push({ page: i + 1, blob: new Blob([pdfBytes], { type: 'application/pdf' }) });
      }
      setSplitBlobs(blobs);
    } catch (e) {
      toast('Error splitting PDF: ' + e.message);
    }
    setIsProcessing(false);
  };

  const handlePageDownload = (item) => {
    const ok = downloadBlob(item.blob, `page-${item.page}.pdf`);
    if (!ok) toast('Could not download this page. Please try splitting again.');
  };

  return (
    <ToolLayout tool={tool}>
      <div className="tool-section-layout">
        {!file ? (
          <div className="file-upload-zone">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              className="file-upload-input"
              aria-label="Select a PDF to split"
            />
            <UploadCloud size={48} className="file-upload-icon" />
            <h3 className="file-upload-title">Select PDF to Split</h3>
            <p className="text-secondary file-upload-desc">Each page will become a separate PDF</p>
          </div>
        ) : (
          <div className="file-list-container">
            <h3 className="pdf-tool-heading">Selected: {file.name}</h3>
            <div className="file-actions-row">
              <button className="btn-primary" onClick={handleSplit} disabled={isProcessing}>
                {isProcessing ? 'Splitting…' : 'Split into Single Pages'}
              </button>
              <button className="btn-secondary" onClick={() => { setFile(null); setSplitBlobs([]); }}>Clear</button>
            </div>
          </div>
        )}

        {splitBlobs.length > 0 && (
          <div>
            <h3 className="pdf-tool-heading">Split Pages ({splitBlobs.length})</h3>
            <div className="split-items-grid">
              {splitBlobs.map(item => (
                <button
                  key={item.page}
                  className="btn-secondary split-item-card"
                  onClick={() => handlePageDownload(item)}
                  aria-label={`Download page ${item.page}`}
                >
                  <Download size={20} className="pdf-tool-icon-spacing" />
                  Page {item.page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
