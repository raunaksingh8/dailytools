import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import Papa from 'papaparse';
import { ArrowRight, Copy, Trash2, Download } from 'lucide-react';

export const CsvToJsonTool = () => {
  const tool = tools.find(t => t.slug === 'csv-to-json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleConvert = () => {
    if (!input) return;
    Papa.parse(input, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setOutput(JSON.stringify(results.data, null, 2));
      }
    });
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.json';
    a.click();
  };

  const toolbarActions = (
    <>
      <button className="btn-primary" onClick={handleConvert}>Convert <ArrowRight size={16} /></button>
      <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(output)} disabled={!output}><Copy size={16} /> Copy</button>
      <button className="btn-secondary" onClick={handleDownload} disabled={!output}><Download size={16} /> Download</button>
      <button className="btn-secondary" onClick={() => { setInput(''); setOutput(''); }}><Trash2 size={16} /> Clear</button>
    </>
  );

  return (
    <ToolLayout tool={tool} toolbarActions={toolbarActions}>
      <div className="split-workspace" style={{ height: '100%' }}>
        <div className="workspace-panel">
          <div className="workspace-header"><span>CSV Input</span></div>
          <div className="workspace-content" style={{ padding: 0 }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste CSV here (with headers)..." spellCheck="false" />
          </div>
        </div>
        <div className="workspace-panel">
          <div className="workspace-header"><span>JSON Output</span></div>
          <div className="workspace-content" style={{ padding: 0, backgroundColor: 'var(--bg-main)' }}>
            <textarea value={output} readOnly placeholder="Result will appear here..." spellCheck="false" />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export const JsonToCsvTool = () => {
  const tool = tools.find(t => t.slug === 'json-to-csv');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const handleConvert = () => {
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      const csv = Papa.unparse(parsed);
      setOutput(csv);
      setError('');
    } catch (e) {
      setError("Invalid JSON: " + e.message);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.csv';
    a.click();
  };

  const toolbarActions = (
    <>
      <button className="btn-primary" onClick={handleConvert}>Convert <ArrowRight size={16} /></button>
      <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(output)} disabled={!output}><Copy size={16} /> Copy</button>
      <button className="btn-secondary" onClick={handleDownload} disabled={!output}><Download size={16} /> Download</button>
      <button className="btn-secondary" onClick={() => { setInput(''); setOutput(''); setError(''); }}><Trash2 size={16} /> Clear</button>
    </>
  );

  return (
    <ToolLayout tool={tool} toolbarActions={toolbarActions}>
      <div className="split-workspace" style={{ height: '100%' }}>
        <div className="workspace-panel">
          <div className="workspace-header"><span>JSON Input</span></div>
          <div className="workspace-content" style={{ padding: 0 }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JSON array here..." spellCheck="false" />
          </div>
        </div>
        <div className="workspace-panel">
          <div className="workspace-header">
            <span>CSV Output</span>
            {error && <span style={{ color: 'var(--error)' }}>{error}</span>}
          </div>
          <div className="workspace-content" style={{ padding: 0, backgroundColor: 'var(--bg-main)' }}>
            <textarea value={output} readOnly placeholder="Result will appear here..." spellCheck="false" />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export const CsvViewerTool = () => {
  const tool = tools.find(t => t.slug === 'csv-viewer');
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setHeaders(results.meta.fields || []);
          setData(results.data);
        }
      });
    }
  };

  return (
    <ToolLayout tool={tool}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
        {data.length === 0 ? (
          <div style={{ border: '2px dashed var(--accent-primary)', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-xl)', padding: '4rem 2rem', textAlign: 'center', position: 'relative' }}>
            <input type="file" accept=".csv" onChange={handleFile} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            <h3 style={{ color: 'var(--accent-primary)' }}>Select CSV to View</h3>
          </div>
        ) : (
          <div className="workspace-panel" style={{ flex: 1 }}>
            <div className="workspace-header">
              <span>Data Viewer ({data.length} rows)</span>
              <button onClick={() => setData([])} className="text-secondary">Close</button>
            </div>
            <div className="workspace-content" style={{ overflow: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: 'var(--bg-hover)', position: 'sticky', top: 0 }}>
                  <tr>
                    {headers.map((h, i) => <th key={i} style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((row, i) => (
                    <tr key={i}>
                      {headers.map((h, j) => <td key={j} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{row[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 100 && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Showing first 100 rows</div>}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
