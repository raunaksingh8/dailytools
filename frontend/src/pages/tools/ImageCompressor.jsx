import React, { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { UploadCloud, ArrowRight, Download, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { downloadBlob } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';
import '../../styles/file-upload.css';
import '../../styles/image-compressor.css';

const ImageCompressor = () => {
  const tool = tools.find(t => t.slug === 'image-compressor');
  
  const [originalFile, setOriginalFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [originalDetails, setOriginalDetails] = useState(null);
  
  const [compressedUrl, setCompressedUrl] = useState('');
  const [compressedDetails, setCompressedDetails] = useState(null);
  
  const [compressionLevel, setCompressionLevel] = useState(0.8);
  const [isCompressing, setIsCompressing] = useState(false);
  const toast = useToast();

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    
    const img = new Image();
    img.onload = () => {
      setOriginalDetails({
        size: file.size,
        dimensions: `${img.width} x ${img.height}`,
        format: file.type.split('/')[1].toUpperCase()
      });
      setCompressedUrl('');
      setCompressedDetails(null);
    };
    img.src = url;
  };

  const handleCompress = async () => {
    if (!originalFile) return;
    setIsCompressing(true);
    
    const options = {
      maxSizeMB: compressionLevel, 
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    
    try {
      const compressedFile = await imageCompression(originalFile, options);
      const url = URL.createObjectURL(compressedFile);
      setCompressedUrl(url);
      
      const img = new Image();
      img.onload = () => {
        setCompressedDetails({
          size: compressedFile.size,
          dimensions: `${img.width} x ${img.height}`,
          format: compressedFile.type.split('/')[1].toUpperCase(),
          blob: compressedFile
        });
        setIsCompressing(false);
      };
      img.src = url;
    } catch (error) {
      console.error(error);
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedUrl || !compressedDetails) {
      toast('Nothing to download. Please compress an image first.');
      return;
    }
    // compressedDetails.blob is the actual File object
    const ok = downloadBlob(compressedDetails.blob, `compressed-${originalFile.name}`);
    if (!ok) toast('Nothing to download. Please compress an image first.');
  };

  const calculateSavings = () => {
    if (!originalDetails || !compressedDetails) return 0;
    const savings = ((originalDetails.size - compressedDetails.size) / originalDetails.size) * 100;
    return savings > 0 ? Math.round(savings) : 0;
  };

  return (
    <ToolLayout tool={tool}>
      {!originalUrl ? (
        <div className="file-upload-zone">
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileUpload}
            className="file-upload-input"
          />
          <UploadCloud size={48} className="file-upload-icon" />
          <h3 className="file-upload-title">Drop your image here <br/> or click to browse</h3>
          <p className="text-secondary file-upload-desc">Supports JPG, PNG, WebP • Max 10MB</p>
        </div>
      ) : (
        <div className="compressor-layout">

          <div className="compressor-preview-row">
            {/* Original */}
            <div className="compressor-preview-col">
              <h4>Original Image</h4>
              <div className="compressor-preview-pair">
                <div className="compressor-thumb">
                  <img src={originalUrl} alt="Original" />
                </div>
                <div className="compressor-meta">
                  <span className="compressor-meta-label">File size</span>
                  <span className="compressor-meta-size">{formatSize(originalDetails?.size || 0)}</span>
                  <span>Dimensions<br/>{originalDetails?.dimensions}</span>
                  <span>Format<br/>{originalDetails?.format}</span>
                </div>
              </div>
            </div>

            <ArrowRight size={32} className="image-convert-arrow hidden md-block" />

            {/* Compressed */}
            <div className="compressor-preview-col">
              <h4>Compressed Image</h4>
              {compressedUrl ? (
                <div className="compressor-preview-pair">
                  <div className="compressor-thumb">
                    <img src={compressedUrl} alt="Compressed" />
                  </div>
                  <div className="compressor-meta">
                    <div className="compressor-meta-row">
                      <div>
                        <span className="compressor-meta-label">File size</span>
                        <div className="compressor-meta-size">{formatSize(compressedDetails?.size || 0)}</div>
                      </div>
                      {calculateSavings() > 0 && (
                        <span className="compressor-savings-badge">
                          {calculateSavings()}% smaller
                        </span>
                      )}
                    </div>
                    <span>Dimensions<br/>{compressedDetails?.dimensions}</span>
                    <span>Format<br/>{compressedDetails?.format}</span>
                  </div>
                </div>
              ) : (
                <div className="compressor-thumb-placeholder">
                  <ImageIcon size={32} opacity={0.5} />
                </div>
              )}
            </div>
          </div>

          <div className="compressor-divider"></div>

          <div>
            <div className="compressor-level-header">
              <span>Compression Level</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={compressionLevel}
              onChange={(e) => {
                setCompressionLevel(parseFloat(e.target.value));
                setCompressedUrl('');
              }}
              className="compressor-level-range"
            />
            <div className="compressor-level-labels">
              <span>Low (Bigger file)</span>
              <span>Medium (Balanced)</span>
              <span>High (Smaller file)</span>
            </div>
          </div>

          <div className="compressor-actions">
            <button className="btn-primary compressor-btn-wide" onClick={handleCompress} disabled={isCompressing}>
              {isCompressing ? 'Compressing...' : 'Compress Image'}
            </button>
            <button className="btn-secondary compressor-btn-wide" onClick={handleDownload} disabled={!compressedUrl}>
              <Download size={16} /> Download Image
            </button>
            <button className="btn-secondary compressor-btn-icon" onClick={() => setOriginalUrl('')}>
              Reset
            </button>
          </div>

        </div>
      )}
    </ToolLayout>
  );
};

export default ImageCompressor;
