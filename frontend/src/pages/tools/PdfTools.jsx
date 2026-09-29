import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, Download, Plus } from 'lucide-react';

export const PdfMergeTool = () => {
  const tool = tools.find(t => t.slug === 'pdf-merge');
  const [files, setFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (e) => {
    if (e.target.files.length) {
      setFiles([...files, ...Array.from(e.target.files)]);
      setMergedPdfUrl('');
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) return alert("Need at least 2 PDFs to merge");
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (let file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setMergedPdfUrl(URL.createObjectURL(blob));
    } catch (e) {
      alert("Error merging PDFs: " + e.message);
    }
    setIsProcessing(false);
  };

  return (
    <ToolLayout tool={tool}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ border: '2px dashed var(--accent-primary)', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-xl)', padding: '2rem', textAlign: 'center', position: 'relative' }}>
          <input type="file" multiple accept="application/pdf" onChange={handleFiles} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          <UploadCloud size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: 'var(--accent-primary)' }}>Select PDFs to Merge</h3>
        </div>

        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4>Files to Merge:</h4>
            {files.map((f, i) => (
              <div key={i} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                {i + 1}. {f.name}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={handleMerge} disabled={isProcessing}>
                {isProcessing ? 'Merging...' : 'Merge PDFs'}
              </button>
              <button className="btn-secondary" onClick={() => { setFiles([]); setMergedPdfUrl(''); }}>Clear</button>
            </div>
          </div>
        )}

        {mergedPdfUrl && (
          <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Merge Complete!</h3>
            <a href={mergedPdfUrl} download="merged.pdf" className="btn-primary" style={{ display: 'inline-flex' }}>
              <Download size={16} /> Download Merged PDF
            </a>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export const PdfSplitTool = () => {
  const tool = tools.find(t => t.slug === 'pdf-split');
  const [file, setFile] = useState(null);
  const [splitUrls, setSplitUrls] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setSplitUrls([]);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const numPages = pdf.getPageCount();
      const urls = [];

      for (let i = 0; i < numPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        urls.push({ page: i + 1, url: URL.createObjectURL(blob) });
      }
      setSplitUrls(urls);
    } catch (e) {
      alert("Error splitting PDF: " + e.message);
    }
    setIsProcessing(false);
  };

  return (
    <ToolLayout tool={tool}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {!file ? (
          <div style={{ border: '2px dashed var(--accent-primary)', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-xl)', padding: '4rem 2rem', textAlign: 'center', position: 'relative' }}>
            <input type="file" accept="application/pdf" onChange={handleFile} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            <UploadCloud size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: 'var(--accent-primary)' }}>Select PDF to Split</h3>
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Selected: {file.name}</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" onClick={handleSplit} disabled={isProcessing}>
                {isProcessing ? 'Splitting...' : 'Split into single pages'}
              </button>
              <button className="btn-secondary" onClick={() => { setFile(null); setSplitUrls([]); }}>Clear</button>
            </div>
          </div>
        )}

        {splitUrls.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Split Pages ({splitUrls.length}):</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {splitUrls.map(item => (
                <a key={item.page} href={item.url} download={`page-${item.page}.pdf`} className="btn-secondary" style={{ textAlign: 'center' }}>
                  <Download size={16} style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                  Page {item.page}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
