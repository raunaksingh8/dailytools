import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, Download } from 'lucide-react';
import { downloadBlob } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Upload area */}
        <div style={{ border: '2px dashed var(--accent-primary)', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-xl)', padding: '2rem', textAlign: 'center', position: 'relative' }}>
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFiles}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            aria-label="Select PDF files to merge"
          />
          <UploadCloud size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: 'var(--accent-primary)' }}>
            {files.length > 0 ? `${files.length} file(s) selected — click to add more` : 'Select PDFs to Merge'}
          </h3>
          <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Click or drag PDF files here</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4>Files to Merge ({files.length}):</h4>
            {files.map((f, i) => (
              <div key={i} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{i + 1}. {f.name}</span>
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{(f.size / 1024).toFixed(0)} KB</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleMerge} disabled={isProcessing}>
                {isProcessing ? 'Merging…' : 'Merge PDFs'}
              </button>
              {mergedBlob && (
                <button className="btn-primary" onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={16} /> Download Merged PDF
                </button>
              )}
              <button className="btn-secondary" onClick={handleClear}>Clear</button>
            </div>
          </div>
        )}

        {/* Success state */}
        {mergedBlob && (
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Merge complete! {files.length} PDFs merged.</span>
            <button className="btn-primary" onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {!file ? (
          <div style={{ border: '2px dashed var(--accent-primary)', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-xl)', padding: '4rem 2rem', textAlign: 'center', position: 'relative' }}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              aria-label="Select a PDF to split"
            />
            <UploadCloud size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: 'var(--accent-primary)' }}>Select PDF to Split</h3>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Each page will become a separate PDF</p>
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Selected: {file.name}</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleSplit} disabled={isProcessing}>
                {isProcessing ? 'Splitting…' : 'Split into Single Pages'}
              </button>
              <button className="btn-secondary" onClick={() => { setFile(null); setSplitBlobs([]); }}>Clear</button>
            </div>
          </div>
        )}

        {splitBlobs.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Split Pages ({splitBlobs.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
              {splitBlobs.map(item => (
                <button
                  key={item.page}
                  className="btn-secondary"
                  onClick={() => handlePageDownload(item)}
                  style={{ flexDirection: 'column', padding: '1rem 0.5rem', minHeight: '80px' }}
                  aria-label={`Download page ${item.page}`}
                >
                  <Download size={20} style={{ marginBottom: '0.5rem' }} />
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
