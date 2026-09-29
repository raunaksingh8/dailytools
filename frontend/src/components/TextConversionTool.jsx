import React, { useState } from 'react';
import ToolLayout from './ToolLayout';
import { tools } from '../data/tools';
import { Copy, Trash2, ArrowRight } from 'lucide-react';

export const TextConversionTool = ({ slug, processFn, actionName, inputPlaceholder = "Enter text here...", outputPlaceholder = "Result will appear here..." }) => {
  const tool = tools.find(t => t.slug === slug);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  const handleProcess = () => {
    if (!input) return;
    try {
      const res = processFn(input);
      setOutput(res);
      setError(null);
    } catch (e) {
      setError(e.message || "An error occurred");
    }
  };

  const toolbarActions = (
    <>
      <button className="btn-primary" onClick={handleProcess}>
        {actionName} <ArrowRight size={16} />
      </button>
      <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(output)} disabled={!output}>
        <Copy size={16} /> Copy Output
      </button>
      <button className="btn-secondary" onClick={() => { setInput(''); setOutput(''); setError(null); }}>
        <Trash2 size={16} /> Clear
      </button>
    </>
  );

  return (
    <ToolLayout tool={tool} toolbarActions={toolbarActions}>
      <div className="split-workspace" style={{ height: '100%' }}>
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
            />
          </div>
        </div>

        <div className="workspace-panel">
          <div className="workspace-header">
            <span>Output</span>
            {error && <span style={{ color: 'var(--error)' }}>{error}</span>}
          </div>
          <div className="workspace-content" style={{ padding: 0, backgroundColor: 'var(--bg-main)' }}>
            <textarea
              value={output}
              readOnly
              placeholder={outputPlaceholder}
              spellCheck="false"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
