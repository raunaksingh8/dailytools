import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { Copy, Download, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { downloadFile } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';
import '../../styles/json-formatter.css';

const JsonFormatter = () => {
  const tool = tools.find(t => t.slug === 'json-formatter');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState(null);
  const toast = useToast();

  const handleFormat = () => {
    if (!input.trim()) {
      setStatus(null);
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setStatus({ type: 'success', message: 'Valid JSON' });
    } catch (error) {
      setStatus({ type: 'error', message: `Invalid JSON: ${error.message}` });
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setStatus({ type: 'success', message: 'Valid JSON' });
    } catch (error) {
      setStatus({ type: 'error', message: `Invalid JSON: ${error.message}` });
    }
  };
  
  const handleValidate = () => {
    handleFormat();
  };

  const handleCopy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setStatus(null);
  };

  const handleDownload = () => {
    const ok = downloadFile(output, 'formatted.json', 'application/json');
    if (!ok) toast('Nothing to download. Please format some JSON first.');
  };

  const toolbarActions = (
    <>
      <button className="btn-primary" onClick={handleFormat}>
        <CheckCircle size={16} /> Format JSON
      </button>
      <button className="btn-secondary" onClick={handleMinify}>
        <span>⤡</span> Minify
      </button>
      <button className="btn-secondary" onClick={handleValidate}>
        <CheckCircle size={16} /> Validate
      </button>
      <button className="btn-secondary" onClick={handleCopy} title="Copy Output" aria-label="Copy Output">
        <Copy size={16} /> Copy Output
      </button>
      <button className="btn-secondary" onClick={handleDownload} title="Download" disabled={!output}>
        <Download size={16} /> Download
      </button>
    </>
  );

  return (
    <ToolLayout 
      tool={tool} 
      toolbarActions={toolbarActions}
      about="This tool helps you format, validate and beautify JSON data. You can also minify JSON, check for syntax errors and copy or download the result."
      relatedTools={['json-validator', 'json-minifier', 'json-to-csv', 'csv-to-json', 'text-diff']}
    >
      <div className="split-workspace json-formatter-workspace">
        {/* Left Panel: Input */}
        <div className="workspace-panel">
          <div className="workspace-header">
            <span>Input</span>
            <button onClick={handleClear} className="json-formatter-clear-btn">
              <Trash2 size={14} /> Clear
            </button>
          </div>
          <div className="workspace-content json-formatter-panel-content">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your JSON here..."
              spellCheck="false"
            />
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="workspace-panel">
          <div className="workspace-header">
            <span>Output</span>
            <button onClick={handleCopy} className="json-formatter-copy-btn">
              <Copy size={14} /> Copy
            </button>
          </div>
          <div className="workspace-content json-formatter-output-content">
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
              spellCheck="false"
            />
          </div>
        </div>
      </div>
      
      {status && (
        <div className={`json-formatter-status ${status.type}`}>
          <div className="json-formatter-status-msg">
            {status.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            {status.message}
          </div>
          {status.type === 'success' && output && (
            <span className="json-formatter-status-meta">
              {output.split('\n').length} lines · {output.length} chars
            </span>
          )}
        </div>
      )}
    </ToolLayout>
  );
};

export default JsonFormatter;
