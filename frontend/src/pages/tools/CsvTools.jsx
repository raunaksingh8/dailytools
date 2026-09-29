import React, { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import Papa from 'papaparse';
import { ArrowRight, Copy, Trash2, Download } from 'lucide-react';
import { downloadFile } from '../../utils/downloadFile';
import { useToast } from '../../components/Toast';
import '../../styles/csv-tools.css';
import '../../styles/file-upload.css';

export const CsvToJsonTool = () => {
  const tool = tools.find(t => t.slug === 'csv-to-json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toast = useToast();

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
    const ok = downloadFile(output, 'converted.json', 'application/json');
    if (!ok) toast('Nothing to download. Please convert some CSV first.');
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
      <div className="split-workspace csv-workspace">
        <div className="workspace-panel">
          <div className="workspace-header"><span>CSV Input</span></div>
          <div className="workspace-content csv-content-no-pad">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste CSV here (with headers)..." spellCheck="false" />
          </div>
        </div>
        <div className="workspace-panel">
          <div className="workspace-header"><span>JSON Output</span></div>
          <div className="workspace-content csv-output-content">
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
  const toast = useToast();

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
    const ok = downloadFile(output, 'converted.csv', 'text/csv');
    if (!ok) toast('Nothing to download. Please convert some JSON first.');
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
      <div className="split-workspace csv-workspace">
        <div className="workspace-panel">
          <div className="workspace-header"><span>JSON Input</span></div>
          <div className="workspace-content csv-content-no-pad">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JSON array here..." spellCheck="false" />
          </div>
        </div>
        <div className="workspace-panel">
          <div className="workspace-header">
            <span>CSV Output</span>
            {error && <span className="csv-error-text">{error}</span>}
          </div>
          <div className="workspace-content csv-output-content">
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
      <div className="tool-section-layout">
        {data.length === 0 ? (
          <div className="file-upload-zone">
            <input type="file" accept=".csv" onChange={handleFile} className="file-upload-input" />
            <h3 className="file-upload-title">Select CSV to View</h3>
          </div>
        ) : (
          <div className="workspace-panel csv-workspace-panel">
            <div className="workspace-header">
              <span>Data Viewer ({data.length} rows)</span>
              <button onClick={() => setData([])} className="text-secondary">Close</button>
            </div>
            <div className="workspace-content csv-viewer-content table-scroll-wrapper">
              <table className="csv-viewer-table">
                <thead className="csv-viewer-thead">
                  <tr>
                    {headers.map((h, i) => <th key={i} className="csv-viewer-th">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((row, i) => (
                    <tr key={i}>
                      {headers.map((h, j) => <td key={j} className="csv-viewer-td">{row[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 100 && <div className="csv-viewer-footer-msg">Showing first 100 rows</div>}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
