import React, { useState } from 'react';
import { TextConversionTool } from '../../components/TextConversionTool';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { format as sqlFormat } from 'sql-formatter';
import { jwtDecode } from 'jwt-decode';

// Base64
export const Base64Tool = () => (
  <TextConversionTool 
    slug="base64" actionName="Encode/Decode"
    processFn={(input) => {
      try {
        const decoded = atob(input);
        if (btoa(decoded) === input) return decoded;
      } catch (e) {}
      return btoa(input);
    }}
  />
);

// URL Encoder
export const UrlEncoderTool = () => (
  <TextConversionTool 
    slug="url-encoder" actionName="Encode/Decode URL"
    processFn={(input) => {
      try { return decodeURIComponent(input) !== input ? decodeURIComponent(input) : encodeURIComponent(input); } 
      catch (e) { return encodeURIComponent(input); }
    }}
  />
);

// HTML Encoder
export const HtmlEncoderTool = () => (
  <TextConversionTool 
    slug="html-encoder" actionName="Encode HTML"
    processFn={(input) => {
      const el = document.createElement('div');
      el.innerText = input;
      return el.innerHTML;
    }}
  />
);

// UUID Generator
export const UuidGeneratorTool = () => (
  <TextConversionTool 
    slug="uuid-generator" actionName="Generate UUIDs"
    inputPlaceholder="Enter number of UUIDs (max 1000)"
    processFn={(input) => {
      const count = parseInt(input) || 1;
      let res = '';
      for(let i=0; i<Math.min(count, 1000); i++) res += uuidv4() + '\n';
      return res.trim();
    }}
    downloadConfig={{ filename: 'uuids.txt', mimeType: 'text/plain' }}
  />
);

// Hash Generator
export const HashGeneratorTool = () => (
  <TextConversionTool 
    slug="hash-generator" actionName="Generate Hashes"
    processFn={(input) => {
      return `MD5:\n${CryptoJS.MD5(input).toString()}\n\nSHA-1:\n${CryptoJS.SHA1(input).toString()}\n\nSHA-256:\n${CryptoJS.SHA256(input).toString()}\n\nSHA-512:\n${CryptoJS.SHA512(input).toString()}`;
    }}
    downloadConfig={{ filename: 'hashes.txt', mimeType: 'text/plain' }}
  />
);

// Escape / Unescape
export const EscapeUnescapeTool = () => (
  <TextConversionTool 
    slug="escape-unescape" actionName="Escape/Unescape"
    processFn={(input) => {
      if (input.includes('\\n') || input.includes('\\"')) {
        return input.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
      return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    }}
  />
);

// Unicode Converter
export const UnicodeConverterTool = () => (
  <TextConversionTool 
    slug="unicode-converter" actionName="Convert"
    processFn={(input) => {
      if (input.includes('\\u')) {
        return input.replace(/\\u[\dA-F]{4}/gi, (match) => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));
      }
      return input.split('').map(char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')).join('');
    }}
  />
);

// JWT Decoder
export const JwtDecoderTool = () => (
  <TextConversionTool 
    slug="jwt-decoder" actionName="Decode JWT"
    processFn={(input) => {
      const decoded = jwtDecode(input, { header: true });
      const payload = jwtDecode(input);
      return `HEADER:\n${JSON.stringify(decoded, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}`;
    }}
  />
);

// SQL Formatter
export const SqlFormatterTool = () => (
  <TextConversionTool 
    slug="sql-formatter" actionName="Format SQL"
    processFn={(input) => sqlFormat(input, { language: 'sql', tabWidth: 2, keywordCase: 'upper' })}
    downloadConfig={{ filename: 'formatted.sql', mimeType: 'text/plain' }}
  />
);

// SQL IN Generator
export const SqlInGeneratorTool = () => (
  <TextConversionTool 
    slug="sql-in-generator" actionName="Generate IN Clause"
    inputPlaceholder="Paste list of items, one per line"
    processFn={(input) => {
      const items = input.split('\n').map(s => s.trim()).filter(Boolean);
      if (!items.length) return '';
      const formatted = items.map(i => `'${i.replace(/'/g, "''")}'`).join(', ');
      return `IN (${formatted})`;
    }}
    downloadConfig={{ filename: 'sql-in-clause.sql', mimeType: 'text/plain' }}
  />
);

// Timestamp Converter
export const TimestampConverterTool = () => (
  <TextConversionTool 
    slug="timestamp-converter" actionName="Convert"
    inputPlaceholder="Enter Unix timestamp (seconds/ms) OR ISO date string"
    processFn={(input) => {
      const val = input.trim();
      let date;
      if (/^\d+$/.test(val)) {
        const num = parseInt(val, 10);
        date = new Date(num > 9999999999 ? num : num * 1000);
      } else {
        date = new Date(val);
      }
      if (isNaN(date.getTime())) throw new Error("Invalid date/timestamp");
      return `Local: ${date.toString()}\nUTC: ${date.toUTCString()}\nUnix (ms): ${date.getTime()}\nUnix (s): ${Math.floor(date.getTime() / 1000)}\nISO: ${date.toISOString()}`;
    }}
  />
);

// URL Parser
export const UrlParserTool = () => (
  <TextConversionTool 
    slug="url-parser" actionName="Parse URL"
    processFn={(input) => {
      const url = new URL(input);
      const params = Object.fromEntries(url.searchParams.entries());
      return JSON.stringify({
        href: url.href, protocol: url.protocol, host: url.host,
        hostname: url.hostname, port: url.port, pathname: url.pathname,
        search: url.search, hash: url.hash, params
      }, null, 2);
    }}
  />
);

// User Agent Parser
export const UserAgentParserTool = () => (
  <TextConversionTool 
    slug="user-agent-parser" actionName="Parse UA"
    processFn={(input) => {
      const ua = input;
      let browser = "Unknown", os = "Unknown";
      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari")) browser = "Safari";
      else if (ua.includes("Edge")) browser = "Edge";
      
      if (ua.includes("Win")) os = "Windows";
      else if (ua.includes("Mac")) os = "MacOS";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("like Mac")) os = "iOS";
      
      return `Browser: ${browser}\nOS: ${os}\nRaw: ${ua}`;
    }}
  />
);

// HTTP Headers Parser
export const HttpHeadersTool = () => (
  <TextConversionTool 
    slug="http-headers" actionName="Parse Headers"
    inputPlaceholder="Paste raw HTTP headers here..."
    processFn={(input) => {
      const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
      const headers = {};
      lines.forEach(line => {
        const idx = line.indexOf(':');
        if(idx !== -1) headers[line.slice(0, idx).trim()] = line.slice(idx+1).trim();
      });
      return JSON.stringify(headers, null, 2);
    }}
  />
);

// Case Converter
export const CaseConverterTool = () => (
  <TextConversionTool 
    slug="case-converter" actionName="Convert Cases"
    processFn={(input) => {
      return `UPPERCASE:\n${input.toUpperCase()}\n\nlowercase:\n${input.toLowerCase()}\n\nTitle Case:\n${input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}`;
    }}
  />
);

// Remove Duplicate Lines
export const RemoveDuplicateLinesTool = () => (
  <TextConversionTool 
    slug="remove-duplicate-lines" actionName="Remove Duplicates"
    processFn={(input) => [...new Set(input.split('\n'))].join('\n')}
  />
);

// Remove Empty Lines
export const RemoveEmptyLinesTool = () => (
  <TextConversionTool 
    slug="remove-empty-lines" actionName="Remove Empty Lines"
    processFn={(input) => input.split('\n').filter(line => line.trim().length > 0).join('\n')}
  />
);

// cURL Generator
export const CurlGeneratorTool = () => (
  <TextConversionTool 
    slug="curl-generator" actionName="Generate cURL"
    inputPlaceholder="Paste JSON with { method, url, headers, body }"
    processFn={(input) => {
      const req = JSON.parse(input);
      let curl = `curl -X ${req.method || 'GET'} '${req.url}'`;
      if (req.headers) {
        Object.entries(req.headers).forEach(([k, v]) => {
          curl += ` \\\n  -H '${k}: ${v}'`;
        });
      }
      if (req.body) {
        curl += ` \\\n  -d '${typeof req.body === 'object' ? JSON.stringify(req.body) : req.body}'`;
      }
      return curl;
    }}
    downloadConfig={{ filename: 'request.sh', mimeType: 'text/plain' }}
  />
);

// HTTP Status Codes (Lookup)
export const HttpStatusCodesTool = () => {
  const [input, setInput] = useState('');
  const statuses = {
    200: "OK", 201: "Created", 204: "No Content",
    301: "Moved Permanently", 304: "Not Modified",
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
    500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable"
  };
  return (
    <TextConversionTool 
      slug="http-status-codes" actionName="Lookup"
      inputPlaceholder="Enter HTTP status code (e.g., 404)"
      processFn={(input) => {
        const code = parseInt(input.trim());
        return statuses[code] ? `${code}: ${statuses[code]}` : `Unknown Status Code: ${code}`;
      }}
    />
  );
};
