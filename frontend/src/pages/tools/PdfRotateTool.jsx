import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { PDFDocument, degrees } from 'pdf-lib';
import { UploadCloud, Download, RotateCw } from 'lucide-react';
import { downloadBlob } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';
import '../../styles/file-upload.css';
import '../../styles/pdf-tools.css';

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
      <div className="tool-section-layout">
        {!file ? (
          <div className="file-upload-zone">
            <input type="file" accept="application/pdf" onChange={handleFile} className="file-upload-input" />
            <UploadCloud size={48} className="file-upload-icon" />
            <h3 className="file-upload-title">Select PDF to Rotate</h3>
          </div>
        ) : (
          <div className="file-list-container">
            <h3 className="pdf-tool-heading">Selected: {file.name}</h3>
            <div className="file-actions-row">
              <button className="btn-primary" onClick={handleRotate} disabled={isProcessing}>
                <RotateCw size={16} /> {isProcessing ? 'Rotating...' : 'Rotate All Pages 90°'}
              </button>
              <button className="btn-secondary" onClick={() => { setFile(null); setRotatedBlob(null); }}>Clear</button>
            </div>
          </div>
        )}

        {rotatedBlob && (
          <div className="tool-success-alert">
            <span className="tool-success-text">✓ Rotation complete!</span>
            <button className="btn-primary btn-icon-label" onClick={handleDownload}>
              <Download size={16} /> Download Rotated PDF
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
