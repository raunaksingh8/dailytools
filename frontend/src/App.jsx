import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider } from './components/Toast';
import Home from './pages/Home';

import Developer from './pages/Developer';
import Files from './pages/Files';
import Text from './pages/Text';

import JsonFormatter from './pages/tools/JsonFormatter';
import ImageCompressor from './pages/tools/ImageCompressor';
import WordCounter from './pages/tools/WordCounter';

import { 
  Base64Tool, UrlEncoderTool, HtmlEncoderTool, 
  UuidGeneratorTool, HashGeneratorTool, EscapeUnescapeTool,
  UnicodeConverterTool, JwtDecoderTool, SqlFormatterTool,
  SqlInGeneratorTool, TimestampConverterTool, UrlParserTool,
  UserAgentParserTool, HttpHeadersTool, CaseConverterTool,
  RemoveDuplicateLinesTool, RemoveEmptyLinesTool, CurlGeneratorTool,
  HttpStatusCodesTool
} from './pages/tools/SimpleTools';

import { PdfMergeTool, PdfSplitTool } from './pages/tools/PdfTools';
import { CsvToJsonTool, JsonToCsvTool, CsvViewerTool } from './pages/tools/CsvTools';
import { TextDiffTool, JsonDiffTool } from './pages/tools/TextDiff';
import { GenericImageConverter } from './pages/tools/ImageTools';

import { tools } from './data/tools';

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/files" element={<Files />} />
            <Route path="/text" element={<Text />} />
            
            {/* Developer */}
            <Route path="/developer/json-formatter" element={<JsonFormatter />} />
            <Route path="/developer/json-validator" element={<JsonFormatter />} />
            <Route path="/developer/json-minifier" element={<JsonFormatter />} />
            <Route path="/developer/json-diff" element={<JsonDiffTool />} />
            
            <Route path="/developer/base64" element={<Base64Tool />} />
            <Route path="/developer/url-encoder" element={<UrlEncoderTool />} />
            <Route path="/developer/html-encoder" element={<HtmlEncoderTool />} />
            <Route path="/developer/unicode-converter" element={<UnicodeConverterTool />} />
            <Route path="/developer/escape-unescape" element={<EscapeUnescapeTool />} />
            
            <Route path="/developer/jwt-decoder" element={<JwtDecoderTool />} />
            <Route path="/developer/http-status-codes" element={<HttpStatusCodesTool />} />
            <Route path="/developer/url-parser" element={<UrlParserTool />} />
            <Route path="/developer/curl-generator" element={<CurlGeneratorTool />} />
            <Route path="/developer/user-agent-parser" element={<UserAgentParserTool />} />
            <Route path="/developer/http-headers" element={<HttpHeadersTool />} />
            
            <Route path="/developer/sql-formatter" element={<SqlFormatterTool />} />
            <Route path="/developer/sql-in-generator" element={<SqlInGeneratorTool />} />
            
            <Route path="/developer/uuid-generator" element={<UuidGeneratorTool />} />
            <Route path="/developer/timestamp-converter" element={<TimestampConverterTool />} />
            <Route path="/developer/hash-generator" element={<HashGeneratorTool />} />

            {/* Files */}
            <Route path="/files/image-compressor" element={<ImageCompressor />} />
            <Route path="/files/jpg-to-png" element={<GenericImageConverter slug="jpg-to-png" targetFormat="image/png" formatName="PNG" />} />
            <Route path="/files/png-to-jpg" element={<GenericImageConverter slug="png-to-jpg" targetFormat="image/jpeg" formatName="JPG" />} />
            <Route path="/files/webp-converter" element={<GenericImageConverter slug="webp-converter" targetFormat="image/webp" formatName="WebP" />} />
            <Route path="/files/pdf-to-jpg" element={<GenericImageConverter slug="pdf-to-jpg" targetFormat="image/jpeg" formatName="JPG" />} />
            
            <Route path="/files/csv-to-json" element={<CsvToJsonTool />} />
            <Route path="/files/json-to-csv" element={<JsonToCsvTool />} />
            <Route path="/files/csv-viewer" element={<CsvViewerTool />} />
            
            <Route path="/files/pdf-merge" element={<PdfMergeTool />} />
            <Route path="/files/pdf-split" element={<PdfSplitTool />} />

            {/* Text */}
            <Route path="/text/word-counter" element={<WordCounter />} />
            <Route path="/text/character-counter" element={<WordCounter />} />
            <Route path="/text/sentence-counter" element={<WordCounter />} />
            <Route path="/text/line-counter" element={<WordCounter />} />
            <Route path="/text/reading-time" element={<WordCounter />} />
            <Route path="/text/paragraph-counter" element={<WordCounter />} />
            
            <Route path="/text/case-converter" element={<CaseConverterTool />} />
            <Route path="/text/remove-duplicate-lines" element={<RemoveDuplicateLinesTool />} />
            <Route path="/text/remove-empty-lines" element={<RemoveEmptyLinesTool />} />
            <Route path="/text/text-diff" element={<TextDiffTool />} />

            {/* 404 */}
            <Route path="*" element={
              <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h2>404 - Not Found</h2>
                <p className="text-secondary" style={{ marginTop: '1rem' }}>The page you are looking for doesn't exist.</p>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
