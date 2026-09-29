import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { UploadCloud, ArrowRight, Download, Image as ImageIcon } from 'lucide-react';
import { downloadBlob } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';
import '../../styles/file-upload.css';
import '../../styles/image-tools.css';

export const GenericImageConverter = ({ slug, targetFormat, formatName }) => {
  const tool = tools.find(t => t.slug === slug);
  const [originalFile, setOriginalFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [convertedUrl, setConvertedUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

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

  const handleDownload = async () => {
    if (!convertedUrl || !originalFile) {
      toast('Nothing to download. Please convert an image first.');
      return;
    }
    const response = await fetch(convertedUrl);
    const blob = await response.blob();
    const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;
    const ext = formatName.toLowerCase();
    const ok = downloadBlob(blob, `${baseName}-converted.${ext}`);
    if (!ok) toast('Nothing to download. Please convert an image first.');
  };

  return (
    <ToolLayout tool={tool}>
      {!originalUrl ? (
        <div className="file-upload-zone">
          <input type="file" accept="image/*" onChange={handleFileUpload} className="file-upload-input" />
          <UploadCloud size={48} className="file-upload-icon" />
          <h3 className="file-upload-title">Drop your image here <br/> or click to browse</h3>
        </div>
      ) : (
        <div className="image-tool-layout">
          <div className="image-preview-row">
            <div className="image-preview-col">
              <h4>Original Image</h4>
              <div className="image-preview-box">
                <img src={originalUrl} alt="Original" />
              </div>
            </div>

            <ArrowRight size={32} className="image-convert-arrow hidden md-block" />

            <div className="image-preview-col">
              <h4>Converted to {formatName}</h4>
              {convertedUrl ? (
                <div className="image-preview-box">
                  <img src={convertedUrl} alt="Converted" />
                </div>
              ) : (
                <div className="image-placeholder-box">
                  <ImageIcon size={32} opacity={0.5} />
                </div>
              )}
            </div>
          </div>

          <div className="image-tool-actions">
            <button className="btn-primary image-tool-btn-wide" onClick={handleConvert} disabled={isProcessing}>
              {isProcessing ? 'Converting...' : `Convert to ${formatName}`}
            </button>
            <button className="btn-secondary image-tool-btn-wide" onClick={handleDownload} disabled={!convertedUrl}>
              <Download size={16} /> Download
            </button>
            <button className="btn-secondary image-tool-btn-icon" onClick={() => { setOriginalUrl(''); setConvertedUrl(''); }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
