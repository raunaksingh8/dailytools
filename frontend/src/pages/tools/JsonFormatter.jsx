import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { Copy, Download, Trash2, CheckCircle, XCircle } from 'lucide-react';

const JsonFormatter = () => {
  const tool = tools.find(t => t.slug === 'json-formatter');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState(null); 

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
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toolbarActions = (
    <>
      <button className="btn-primary" onClick={handleFormat}>
        <CheckCircle size={16} /> Format JSON
      </button>
      <button className="btn-secondary" onClick={handleMinify}>
        <span style={{ transform: 'rotate(45deg)', display: 'inline-block' }}>⤡</span> Minify
      </button>
      <button className="btn-secondary" onClick={handleValidate}>
        <CheckCircle size={16} /> Validate
      </button>
      <button className="btn-secondary" onClick={handleCopy} title="Copy Output" style={{ marginLeft: 'auto' }}>
        <Copy size={16} /> Copy Output
      </button>
      <button className="btn-secondary" onClick={handleDownload} title="Download">
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
      <div className="split-workspace" style={{ height: '100%' }}>
        {/* Left Panel: Input */}
        <div className="workspace-panel">
          <div className="workspace-header">
            <span>Input</span>
            <button onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              <Trash2 size={14} /> Clear
            </button>
          </div>
          <div className="workspace-content" style={{ padding: 0 }}>
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
            <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <div className="workspace-content" style={{ padding: 0, backgroundColor: 'var(--bg-main)' }}>
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
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem 1.5rem', 
          borderRadius: 'var(--radius-md)', 
          backgroundColor: status.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
          color: status.type === 'success' ? 'var(--success)' : 'var(--error)',
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 500
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            {status.message}
          </div>
          {status.type === 'success' && output && (
            <span style={{ fontSize: '0.875rem' }}>
              {output.split('\n').length} lines • {output.length} characters
            </span>
          )}
        </div>
      )}
    </ToolLayout>
  );
};

export default JsonFormatter;
