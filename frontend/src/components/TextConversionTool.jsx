import React, { useState } from 'react';
import ToolLayout from './ToolLayout';
import { tools } from '../data/tools';
import { Copy, Trash2, ArrowRight, Download } from 'lucide-react';
import { downloadFile } from '../utils/downloadFile';
import { useToast } from './Toast';

/**
 * Generic two-panel (Input → Output) conversion tool.
 *
 * Props:
 *  slug            – tool slug to look up from tools list
 *  processFn       – (input: string) => string | throws
 *  actionName      – label on the primary action button
 *  inputPlaceholder
 *  outputPlaceholder
 *  downloadConfig  – optional { filename: 'output.sql', mimeType: 'text/plain' }
 *                    When provided, a Download button is shown in the toolbar.
 */
export const TextConversionTool = ({
  slug,
  processFn,
  actionName,
  inputPlaceholder = 'Enter text here…',
  outputPlaceholder = 'Result will appear here…',
  downloadConfig = null,
}) => {
  const tool = tools.find((t) => t.slug === slug);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const toast = useToast();

  const handleProcess = () => {
    if (!input) return;
    try {
      const res = processFn(input);
      setOutput(res);
      setError(null);
    } catch (e) {
      setError(e.message || 'An error occurred');
      setOutput('');
    }
  };

  const handleDownload = () => {
    if (!downloadConfig) return;
    const ok = downloadFile(
      output,
      downloadConfig.filename,
      downloadConfig.mimeType || 'text/plain'
    );
    if (!ok) toast('Nothing to download. Please generate some content first.');
  };

  const toolbarActions = (
    <>
      <button className="btn-primary" onClick={handleProcess} aria-label={actionName}>
        {actionName} <ArrowRight size={15} />
      </button>
      <button
        className="btn-secondary"
        onClick={() => navigator.clipboard.writeText(output)}
        disabled={!output}
        aria-label="Copy output"
      >
        <Copy size={15} /> Copy
      </button>
      {downloadConfig && (
        <button
          className="btn-secondary"
          onClick={handleDownload}
          disabled={!output}
          aria-label="Download output"
        >
          <Download size={15} /> Download
        </button>
      )}
      <button
        className="btn-secondary"
        onClick={() => { setInput(''); setOutput(''); setError(null); }}
        aria-label="Clear"
      >
        <Trash2 size={15} /> Clear
      </button>
    </>
  );

  return (
    <ToolLayout tool={tool} toolbarActions={toolbarActions}>
      <div className="split-workspace">
        {/* Input */}
        <div className="workspace-panel">
          <div className="workspace-header">
            <span>Input</span>
          </div>
          <div className="workspace-content" style={{ padding: 0 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              spellCheck="false"
              aria-label="Input"
            />
          </div>
        </div>

        {/* Output */}
        <div className="workspace-panel">
          <div className="workspace-header">
            <span>Output</span>
            {error && <span style={{ color: 'var(--error)', fontSize: '0.8125rem', fontWeight: 400 }}>{error}</span>}
          </div>
          <div className="workspace-content" style={{ padding: 0, backgroundColor: 'var(--bg-main)' }}>
            <textarea
              value={output}
              readOnly
              placeholder={outputPlaceholder}
              spellCheck="false"
              aria-label="Output"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
