import React, { useEffect, useRef, useState } from 'react';
import {
    Upload,
    Image as ImageIcon,
    Download,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Loader2,
    X,
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import '../../styles/bgremoval.css';

const BgRemoval = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [originalUrl, setOriginalUrl] = useState('');
    const [resultUrl, setResultUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processingStage, setProcessingStage] = useState('');
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);
    const progressAnimationRef = useRef(null);

    useEffect(() => {
        return () => {
            if (originalUrl) {
                URL.revokeObjectURL(originalUrl);
            }

            if (resultUrl) {
                URL.revokeObjectURL(resultUrl);
            }

            if (progressAnimationRef.current) {
                cancelAnimationFrame(progressAnimationRef.current);
            }
        };
    }, [originalUrl, resultUrl]);

    const handleFile = (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            return;
        }

        setError('');
        setSelectedFile(file);
        setResultUrl('');
        setProgress(0);
        setProcessingStage('');

        if (originalUrl) {
            URL.revokeObjectURL(originalUrl);
        }

        setOriginalUrl(URL.createObjectURL(file));
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        handleFile(file);
    };

    const handleDrop = (event) => {
        event.preventDefault();

        const file = event.dataTransfer.files?.[0];
        handleFile(file);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const removeSelectedFile = () => {
        if (progressAnimationRef.current) {
            cancelAnimationFrame(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }

        setSelectedFile(null);
        setResultUrl('');
        setProgress(0);
        setProcessingStage('');
        setError('');
        setIsProcessing(false);

        if (originalUrl) {
            URL.revokeObjectURL(originalUrl);
            setOriginalUrl('');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const startProgress = () => {
        setProgress(0);

        const startTime = performance.now();

        const animateProgress = (currentTime) => {
            const elapsed = currentTime - startTime;

            /*
             * Visual progress:
             * - Starts at 0
             * - Moves continuously
             * - Slowly approaches 95%
             * - Never reaches 100% until processing is actually complete
             */
            const visualProgress =
                95 * (1 - Math.exp(-elapsed / 30000));

            setProgress(Math.min(95, Math.floor(visualProgress)));

            progressAnimationRef.current =
                requestAnimationFrame(animateProgress);
        };

        progressAnimationRef.current =
            requestAnimationFrame(animateProgress);
    };

    const stopProgress = () => {
        if (progressAnimationRef.current) {
            cancelAnimationFrame(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }
    };

    const handleRemoveBackground = async () => {
        if (!selectedFile) return;

        try {
            setIsProcessing(true);
            setProgress(0);
            setProcessingStage('Preparing image...');
            setError('');

            startProgress();

            const resultBlob = await removeBackground(selectedFile, {
                progress: (key) => {
                    if (typeof key !== 'string') {
                        return;
                    }

                    const progressKey = key.toLowerCase();

                    if (progressKey.includes('decode')) {
                        setProcessingStage('Preparing image...');
                    } else if (
                        progressKey.includes('inference') ||
                        progressKey.includes('model')
                    ) {
                        setProcessingStage('Detecting subject...');
                    } else if (
                        progressKey.includes('mask') ||
                        progressKey.includes('segment')
                    ) {
                        setProcessingStage('Removing background...');
                    } else if (
                        progressKey.includes('encode') ||
                        progressKey.includes('output')
                    ) {
                        setProcessingStage('Finalizing image...');
                    }
                },
            });

            /*
             * The actual image is now ready.
             * Stop the visual progress animation first.
             */
            stopProgress();

            setProcessingStage('Finalizing image...');
            setProgress(100);

            const resultObjectUrl = URL.createObjectURL(resultBlob);

            if (resultUrl) {
                URL.revokeObjectURL(resultUrl);
            }

            /*
             * Set the result before ending processing.
             * This makes the image appear only after the processing
             * operation has actually completed.
             */
            setResultUrl(resultObjectUrl);

        } catch (err) {
            console.error('Background removal failed:', err);

            stopProgress();

            setProgress(0);
            setProcessingStage('');

            setError(
                'Something went wrong while removing the background. Please try another image.'
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!resultUrl) return;

        const link = document.createElement('a');

        link.href = resultUrl;
        link.download = 'background-removed.png';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        removeSelectedFile();
    };

    return (
        <div className="bg-removal-page">
            <div className="container">

                <div className="bg-removal-header">
                    <div className="bg-removal-icon">
                        <Sparkles size={22} />
                    </div>

                    <div>
                        <h1>Background Remover</h1>

                        <p>
                            Remove backgrounds from images automatically with AI.
                        </p>
                    </div>
                </div>

                {!selectedFile ? (
                    <div
                        className="bg-removal-upload-card"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <div className="bg-removal-upload-icon">
                            <Upload size={28} />
                        </div>

                        <h2>Upload an image</h2>

                        <p>
                            Drag & drop your image here, or click to browse
                        </p>

                        <span className="bg-removal-upload-hint">
                            JPG, JPEG, PNG or WebP
                        </span>

                        <button
                            type="button"
                            className="btn btn-primary bg-removal-browse-btn"
                            onClick={(event) => {
                                event.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            <Upload size={17} />
                            Choose Image
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleFileChange}
                            hidden
                        />
                    </div>
                ) : (
                    <div className="bg-removal-editor">

                        <div className="bg-removal-editor-top">
                            <div className="bg-removal-file-info">
                                <ImageIcon size={18} />

                                <span title={selectedFile.name}>
                                    {selectedFile.name}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="bg-removal-clear-btn"
                                onClick={removeSelectedFile}
                                aria-label="Remove image"
                                title="Remove image"
                                disabled={isProcessing}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-removal-preview-grid">

                            {/* Original */}

                            <div className="bg-removal-preview-card">

                                <div className="bg-removal-preview-label">
                                    Original
                                </div>

                                <div className="bg-removal-image-container">

                                    <img
                                        src={originalUrl}
                                        alt="Original"
                                        className="bg-removal-preview-image"
                                    />

                                </div>

                            </div>

                            {/* Result */}

                            <div className="bg-removal-preview-card">

                                <div className="bg-removal-preview-label">
                                    Result
                                </div>

                                <div className="bg-removal-image-container bg-removal-result-bg">

                                    {resultUrl ? (

                                        <img
                                            src={resultUrl}
                                            alt="Background removed"
                                            className="bg-removal-preview-image"
                                        />

                                    ) : isProcessing ? (

                                        <div className="bg-removal-processing">

                                            <div className="bg-removal-spinner-wrapper">
                                                <Loader2
                                                    size={34}
                                                    className="bg-removal-processing-spinner"
                                                />
                                            </div>

                                            <h3>
                                                Removing background
                                            </h3>

                                            <p className="bg-removal-processing-stage">
                                                {processingStage || 'Preparing image...'}
                                            </p>

                                            <div className="bg-removal-progress-wrapper">

                                                <div className="bg-removal-progress-header">
                                                    <span>
                                                        Processing
                                                    </span>

                                                    <span>
                                                        {progress}%
                                                    </span>
                                                </div>

                                                <div
                                                    className="bg-removal-progress-track"
                                                    role="progressbar"
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                    aria-valuenow={progress}
                                                >
                                                    <div
                                                        className="bg-removal-progress-fill"
                                                        style={{
                                                            width: `${progress}%`,
                                                        }}
                                                    />
                                                </div>

                                            </div>

                                            <span className="bg-removal-processing-hint">
                                                Please keep this tab open while your image is being processed.
                                            </span>

                                        </div>

                                    ) : (

                                        <div className="bg-removal-empty-result">

                                            <Sparkles size={30} />

                                            <span>
                                                Your result will appear here
                                            </span>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>

                        {error && (
                            <div className="bg-removal-error">
                                {error}
                            </div>
                        )}

                        <div className="bg-removal-actions">

                            {!resultUrl && (
                                <button
                                    type="button"
                                    className="btn btn-primary bg-removal-main-btn"
                                    onClick={handleRemoveBackground}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="bg-removal-spinner"
                                            />

                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />

                                            Remove Background
                                        </>
                                    )}
                                </button>
                            )}

                            {resultUrl && (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-primary bg-removal-main-btn"
                                        onClick={handleDownload}
                                    >
                                        <Download size={18} />

                                        Download PNG
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary bg-removal-reset-btn"
                                        onClick={handleReset}
                                    >
                                        <RotateCcw size={17} />

                                        Start Over
                                    </button>
                                </>
                            )}

                        </div>

                    </div>
                )}

                <div className="bg-removal-privacy">

                    <ShieldCheck size={18} />

                    <div>

                        <strong>
                            Privacy-first processing
                        </strong>

                        <p>
                            Your image is processed directly in your browser and is
                            not unnecessarily uploaded to a server.
                        </p>

                    </div>

                </div>

                <div className="bg-removal-info">

                    <h2>
                        How it works
                    </h2>

                    <div className="bg-removal-steps">

                        <div className="bg-removal-step">

                            <span>1</span>

                            <div>
                                <h3>
                                    Upload an image
                                </h3>

                                <p>
                                    Select the image you want to edit.
                                </p>
                            </div>

                        </div>

                        <div className="bg-removal-step">

                            <span>2</span>

                            <div>
                                <h3>
                                    Remove the background
                                </h3>

                                <p>
                                    AI automatically detects and removes the background.
                                </p>
                            </div>

                        </div>

                        <div className="bg-removal-step">

                            <span>3</span>

                            <div>
                                <h3>
                                    Download PNG
                                </h3>

                                <p>
                                    Download your image with a transparent background.
                                </p>
                            </div>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default BgRemoval;