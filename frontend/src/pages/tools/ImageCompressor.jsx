import React, { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { UploadCloud, ArrowRight, Download, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { downloadBlob } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';

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
        <div 
          style={{
            border: '2px dashed var(--accent-primary)',
            backgroundColor: 'var(--accent-light)',
            borderRadius: 'var(--radius-xl)',
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            onChange={handleFileUpload}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
          />
          <UploadCloud size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Drop your image here <br/> or click to browse</h3>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Supports JPG, PNG, WebP • Max 10MB</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
            {/* Original */}
            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Original Image</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '160px', height: '120px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img src={originalUrl} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem' }}>File size</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.25rem' }}>{formatSize(originalDetails?.size || 0)}</span>
                  <span>Dimensions<br/>{originalDetails?.dimensions}</span>
                  <span>Format<br/>{originalDetails?.format}</span>
                </div>
              </div>
            </div>
            
            <ArrowRight size={32} style={{ color: 'var(--accent-primary)' }} className="hidden md-block" />
            
            {/* Compressed */}
            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Compressed Image</h4>
              {compressedUrl ? (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '160px', height: '120px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <img src={compressedUrl} alt="Compressed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem' }}>File size</span>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.25rem' }}>{formatSize(compressedDetails?.size || 0)}</div>
                      </div>
                      {calculateSavings() > 0 && (
                        <span style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          {calculateSavings()}% smaller
                        </span>
                      )}
                    </div>
                    <span>Dimensions<br/>{compressedDetails?.dimensions}</span>
                    <span>Format<br/>{compressedDetails?.format}</span>
                  </div>
                </div>
              ) : (
                <div style={{ width: '160px', height: '120px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <ImageIcon size={32} opacity={0.5} />
                </div>
              )}
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}></div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
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
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              <span>Low (Bigger file)</span>
              <span>Medium (Balanced)</span>
              <span>High (Smaller file)</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleCompress} disabled={isCompressing} style={{ minWidth: '150px' }}>
              {isCompressing ? 'Compressing...' : 'Compress Image'}
            </button>
            <button className="btn-secondary" onClick={handleDownload} disabled={!compressedUrl} style={{ minWidth: '150px' }}>
              <Download size={16} /> Download Image
            </button>
            <button className="btn-secondary" onClick={() => setOriginalUrl('')} style={{ padding: '0.5rem' }}>
              Reset
            </button>
          </div>
          
        </div>
      )}
    </ToolLayout>
  );
};

export default ImageCompressor;
