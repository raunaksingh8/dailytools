import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { UploadCloud, ArrowRight, Download, Image as ImageIcon } from 'lucide-react';

export const GenericImageConverter = ({ slug, targetFormat, formatName }) => {
  const tool = tools.find(t => t.slug === slug);
  const [originalFile, setOriginalFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [convertedUrl, setConvertedUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setConvertedUrl('');
  };

  const handleConvert = () => {
    if (!originalUrl) return;
    setIsProcessing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setConvertedUrl(url);
        }
        setIsProcessing(false);
      }, targetFormat, 0.9);
    };
    img.src = originalUrl;
  };

  const handleDownload = () => {
    if (!convertedUrl || !originalFile) return;
    const a = document.createElement('a');
    a.href = convertedUrl;
    const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;
    const ext = formatName.toLowerCase();
    a.download = `${baseName}-converted.${ext}`;
    a.click();
  };

  return (
    <ToolLayout tool={tool}>
      {!originalUrl ? (
        <div style={{ border: '2px dashed var(--accent-primary)', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-xl)', padding: '4rem 2rem', textAlign: 'center', position: 'relative' }}>
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          <UploadCloud size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: 'var(--accent-primary)' }}>Drop your image here <br/> or click to browse</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center' }}>
            
            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Original Image</h4>
              <div style={{ width: '100%', maxWidth: '300px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <img src={originalUrl} alt="Original" style={{ width: '100%', display: 'block' }} />
              </div>
            </div>
            
            <ArrowRight size={32} style={{ color: 'var(--accent-primary)' }} />
            
            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Converted to {formatName}</h4>
              {convertedUrl ? (
                <div style={{ width: '100%', maxWidth: '300px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img src={convertedUrl} alt="Converted" style={{ width: '100%', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '100%', maxWidth: '300px', height: '200px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <ImageIcon size={32} opacity={0.5} />
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-primary" onClick={handleConvert} disabled={isProcessing} style={{ minWidth: '150px' }}>
              {isProcessing ? 'Converting...' : `Convert to ${formatName}`}
            </button>
            <button className="btn-secondary" onClick={handleDownload} disabled={!convertedUrl} style={{ minWidth: '150px' }}>
              <Download size={16} /> Download
            </button>
            <button className="btn-secondary" onClick={() => { setOriginalUrl(''); setConvertedUrl(''); }} style={{ padding: '0.5rem' }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
