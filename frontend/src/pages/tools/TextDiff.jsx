import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { diffWords, diffJson } from 'diff';
import { Copy, Download } from 'lucide-react';
import { downloadFile } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';
import '../../styles/text-diff.css';

export const TextDiffTool = () => {
  const tool = tools.find(t => t.slug === 'text-diff');
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [diffResult, setDiffResult] = useState(null);

  const toast = useToast();

  const handleDiff = () => {
    if (!textA && !textB) return;
    const diff = diffWords(textA, textB);
    setDiffResult(diff);
  };

  const handleDownload = () => {
    if (!diffResult) {
      toast('Nothing to download. Please compare some text first.');
      return;
    }
    const plain = diffResult.map(p => {
      if (p.added)   return `[+] ${p.value}`;
      if (p.removed) return `[-] ${p.value}`;
      return p.value;
    }).join('');
    const ok = downloadFile(plain, 'text-diff.txt', 'text/plain');
    if (!ok) toast('Nothing to download. Please compare some text first.');
  };

  const toolbarActions = (
    <>
      <button className="btn-primary" onClick={handleDiff}>Compare Text</button>
      <button className="btn-secondary" onClick={handleDownload} disabled={!diffResult} aria-label="Download diff report">
        <Download size={15} /> Download Report
      </button>
    </>
  );

  return (
    <ToolLayout tool={tool} toolbarActions={toolbarActions}>
      <div className="diff-workspace-layout">
        <div className="split-workspace">
          <div className="workspace-panel">
            <div className="workspace-header">Original Text</div>
            <div className="workspace-content diff-workspace-content">
              <textarea value={textA} onChange={e => setTextA(e.target.value)} placeholder="Paste original text here..." spellCheck="false" />
            </div>
          </div>
          <div className="workspace-panel">
            <div className="workspace-header">Changed Text</div>
            <div className="workspace-content diff-workspace-content">
              <textarea value={textB} onChange={e => setTextB(e.target.value)} placeholder="Paste changed text here..." spellCheck="false" />
            </div>
          </div>
        </div>

        {diffResult && (
          <div className="workspace-panel diff-result-panel">
            <div className="workspace-header">Differences</div>
            <div className="workspace-content diff-result-content">
              {diffResult.map((part, index) => {
                const className = part.added ? 'diff-part-added' : part.removed ? 'diff-part-removed' : 'diff-part-unchanged';
                return (
                  <span key={index} className={className}>
                    {part.value}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export const JsonDiffTool = () => {
  const tool = tools.find(t => t.slug === 'json-diff');
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [error, setError] = useState('');

  const handleDiff = () => {
    try {
      const objA = textA ? JSON.parse(textA) : {};
      const objB = textB ? JSON.parse(textB) : {};
      const diff = diffJson(objA, objB);
      setDiffResult(diff);
      setError('');
    } catch (e) {
      setError("Invalid JSON format. Please check both inputs.");
    }
  };

  const toolbarActions = (
    <button className="btn-primary" onClick={handleDiff}>Compare JSON</button>
  );

  return (
    <ToolLayout tool={tool} toolbarActions={toolbarActions}>
      <div className="diff-workspace-layout">
        <div className="split-workspace">
          <div className="workspace-panel">
            <div className="workspace-header">Original JSON</div>
            <div className="workspace-content diff-workspace-content">
              <textarea value={textA} onChange={e => setTextA(e.target.value)} placeholder="Paste original JSON here..." spellCheck="false" />
            </div>
          </div>
          <div className="workspace-panel">
            <div className="workspace-header">Changed JSON</div>
            <div className="workspace-content diff-workspace-content">
              <textarea value={textB} onChange={e => setTextB(e.target.value)} placeholder="Paste changed JSON here..." spellCheck="false" />
            </div>
          </div>
        </div>

        {error && <div className="diff-error-msg">{error}</div>}

        {diffResult && !error && (
          <div className="workspace-panel diff-result-panel">
            <div className="workspace-header">Differences</div>
            <div className="workspace-content diff-result-content-json">
              {diffResult.map((part, index) => {
                const className = part.added ? 'diff-part-added' : part.removed ? 'diff-part-removed-json' : 'diff-part-unchanged';
                return (
                  <span key={index} className={className}>
                    {part.value}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
