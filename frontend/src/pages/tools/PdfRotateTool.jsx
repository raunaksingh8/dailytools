import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { PDFDocument, degrees } from 'pdf-lib';
import { UploadCloud, Download, RotateCw } from 'lucide-react';
import { downloadBlob } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';

export const PdfRotateTool = () => {
  const tool = tools.find(t => t.slug === 'rotate-pdf');
  const [file, setFile] = useState(null);
  const [rotatedBlob, setRotatedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const handleFile = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setRotatedBlob(null);
    }
  };

  const handleRotate = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();
      pages.forEach(page => {
        const current = page.getRotation().angle;
        page.setRotation(degrees(current + 90));
      });
      const pdfBytes = await pdf.save();
      setRotatedBlob(new Blob([pdfBytes], { type: 'application/pdf' }));
    } catch (e) {
      toast('Error rotating PDF: ' + e.message);
    }
    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (!rotatedBlob) {
      toast('Nothing to download. Please rotate a PDF first.');
      return;
    }
    const ok = downloadBlob(rotatedBlob, `rotated-${file.name}`);
    if (!ok) toast('Nothing to download. The rotated PDF appears to be empty.');
  };

  return (
    <ToolLayout tool={tool}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {!file ? (
          <div style={{ border: '2px dashed var(--accent-primary)', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-xl)', padding: '4rem 2rem', textAlign: 'center', position: 'relative' }}>
            <input type="file" accept="application/pdf" onChange={handleFile} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            <UploadCloud size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: 'var(--accent-primary)' }}>Select PDF to Rotate</h3>
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Selected: {file.name}</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" onClick={handleRotate} disabled={isProcessing}>
                <RotateCw size={16} /> {isProcessing ? 'Rotating...' : 'Rotate All Pages 90°'}
              </button>
              <button className="btn-secondary" onClick={() => { setFile(null); setRotatedUrl(''); }}>Clear</button>
            </div>
          </div>
        )}

        {rotatedBlob && (
          <div style={{ marginTop: '2rem', padding: '1.5rem 2rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Rotation complete!</span>
            <button className="btn-primary" onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={16} /> Download Rotated PDF
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
