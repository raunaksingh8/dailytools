export const tools = [
  // JSON & Data
  { slug: "json-formatter", name: "JSON Formatter", category: "Developer", subcategory: "JSON & Data", description: "Format and beautify JSON", icon: "Braces", route: "/developer/json-formatter", tags: ["json", "format"] },
  { slug: "json-validator", name: "JSON Validator", category: "Developer", subcategory: "JSON & Data", description: "Validate JSON structure", icon: "CheckCircle", route: "/developer/json-validator", tags: ["json", "validate"] },
  { slug: "json-minifier", name: "JSON Minifier", category: "Developer", subcategory: "JSON & Data", description: "Minify JSON data", icon: "Minimize", route: "/developer/json-minifier", tags: ["json", "minify"] },
  { slug: "json-diff", name: "JSON Diff", category: "Developer", subcategory: "JSON & Data", description: "Compare two JSON objects", icon: "Diff", route: "/developer/json-diff", tags: ["json", "diff", "compare"] },
  
  // Encoding & Conversion
  { slug: "base64", name: "Base64", category: "Developer", subcategory: "Encoding & Conversion", description: "Encode and decode Base64", icon: "Binary", route: "/developer/base64", tags: ["base64", "encode", "decode"] },
  { slug: "url-encoder", name: "URL Encoder", category: "Developer", subcategory: "Encoding & Conversion", description: "Encode and decode URLs", icon: "Link", route: "/developer/url-encoder", tags: ["url", "encode"] },
  { slug: "html-encoder", name: "HTML Encoder", category: "Developer", subcategory: "Encoding & Conversion", description: "Encode and decode HTML", icon: "Code", route: "/developer/html-encoder", tags: ["html", "encode"] },
  { slug: "unicode-converter", name: "Unicode Converter", category: "Developer", subcategory: "Encoding & Conversion", description: "Convert between formats", icon: "Hash", route: "/developer/unicode-converter", tags: ["unicode", "convert"] },
  { slug: "escape-unescape", name: "Escape / Unescape", category: "Developer", subcategory: "Encoding & Conversion", description: "Escape or unescape text", icon: "Quote", route: "/developer/escape-unescape", tags: ["escape", "unescape"] },
  
  // API & Web
  { slug: "jwt-decoder", name: "JWT Decoder", category: "Developer", subcategory: "API & Web", description: "Decode JWT tokens", icon: "Key", route: "/developer/jwt-decoder", tags: ["jwt", "decode"] },
  { slug: "http-status-codes", name: "HTTP Status Codes", category: "Developer", subcategory: "API & Web", description: "Lookup HTTP status codes", icon: "Server", route: "/developer/http-status-codes", tags: ["http", "status"] },
  { slug: "url-parser", name: "URL Parser", category: "Developer", subcategory: "API & Web", description: "Parse URLs and query params", icon: "Link2", route: "/developer/url-parser", tags: ["url", "parse"] },
  { slug: "curl-generator", name: "cURL Generator", category: "Developer", subcategory: "API & Web", description: "Generate cURL from request", icon: "Terminal", route: "/developer/curl-generator", tags: ["curl", "generate"] },
  { slug: "user-agent-parser", name: "User Agent Parser", category: "Developer", subcategory: "API & Web", description: "Parse user agent strings", icon: "Monitor", route: "/developer/user-agent-parser", tags: ["user agent", "parse"] },
  { slug: "http-headers", name: "HTTP Headers", category: "Developer", subcategory: "API & Web", description: "View and format headers", icon: "List", route: "/developer/http-headers", tags: ["http", "headers"] },
  
  // SQL
  { slug: "sql-formatter", name: "SQL Formatter", category: "Developer", subcategory: "SQL", description: "Format and beautify SQL queries", icon: "Database", route: "/developer/sql-formatter", tags: ["sql", "format"] },
  { slug: "sql-in-generator", name: "SQL IN Generator", category: "Developer", subcategory: "SQL", description: "Generate SQL IN clause", icon: "ListChecks", route: "/developer/sql-in-generator", tags: ["sql", "in"] },
  
  // Generators & Security
  { slug: "uuid-generator", name: "UUID Generator", category: "Developer", subcategory: "Generators", description: "Generate UUIDs", icon: "Fingerprint", route: "/developer/uuid-generator", tags: ["uuid", "generate"] },
  { slug: "timestamp-converter", name: "Timestamp Converter", category: "Developer", subcategory: "Generators", description: "Convert Unix timestamps", icon: "Clock", route: "/developer/timestamp-converter", tags: ["timestamp", "convert"] },
  { slug: "hash-generator", name: "Hash Generator", category: "Developer", subcategory: "Security", description: "Generate MD5, SHA hashes", icon: "Lock", route: "/developer/hash-generator", tags: ["hash", "md5", "sha"] },
  
  // FILE TOOLS
  { slug: "pdf-merge", name: "PDF Merge", category: "Files", subcategory: "PDF Tools", description: "Combine PDF files", icon: "FileText", route: "/files/pdf-merge", tags: ["pdf", "merge"] },
  { slug: "pdf-split", name: "PDF Split", category: "Files", subcategory: "PDF Tools", description: "Split PDF into pages", icon: "SplitSquareHorizontal", route: "/files/pdf-split", tags: ["pdf", "split"] },
  
  { slug: "image-compressor", name: "Image Compressor", category: "Files", subcategory: "Image Tools", description: "Reduce image file size", icon: "ImageMinus", route: "/files/image-compressor", tags: ["image", "compress"] },
  { slug: "jpg-to-png", name: "JPG → PNG", category: "Files", subcategory: "Image Tools", description: "Convert JPG to PNG", icon: "FileImage", route: "/files/jpg-to-png", tags: ["jpg", "png"] },
  { slug: "png-to-jpg", name: "PNG → JPG", category: "Files", subcategory: "Image Tools", description: "Convert PNG to JPG", icon: "FileImage", route: "/files/png-to-jpg", tags: ["png", "jpg"] },
  { slug: "webp-converter", name: "WebP Converter", category: "Files", subcategory: "Image Tools", description: "Convert to/from WebP", icon: "FileImage", route: "/files/webp-converter", tags: ["webp", "convert"] },
  
  { slug: "csv-to-json", name: "CSV → JSON", category: "Files", subcategory: "CSV & Excel", description: "Convert CSV to JSON", icon: "FileJson", route: "/files/csv-to-json", tags: ["csv", "json"] },
  { slug: "json-to-csv", name: "JSON → CSV", category: "Files", subcategory: "CSV & Excel", description: "Convert JSON to CSV", icon: "FileSpreadsheet", route: "/files/json-to-csv", tags: ["json", "csv"] },
  { slug: "csv-viewer", name: "CSV Viewer", category: "Files", subcategory: "CSV & Excel", description: "View CSV data", icon: "Table", route: "/files/csv-viewer", tags: ["csv", "view"] },
  
  // TEXT TOOLS
  { slug: "word-counter", name: "Word Counter", category: "Text", subcategory: "Counting", description: "Count words and characters", icon: "FileText", route: "/text/word-counter", tags: ["word", "count"] },
  { slug: "character-counter", name: "Character Counter", category: "Text", subcategory: "Counting", description: "Count characters", icon: "Type", route: "/text/character-counter", tags: ["character", "count"] },
  { slug: "sentence-counter", name: "Sentence Counter", category: "Text", subcategory: "Counting", description: "Count sentences", icon: "AlignLeft", route: "/text/sentence-counter", tags: ["sentence", "count"] },
  { slug: "line-counter", name: "Line Counter", category: "Text", subcategory: "Counting", description: "Count lines", icon: "List", route: "/text/line-counter", tags: ["line", "count"] },
  { slug: "reading-time", name: "Reading Time", category: "Text", subcategory: "Counting", description: "Estimate reading time", icon: "Clock", route: "/text/reading-time", tags: ["reading", "time"] },
  { slug: "paragraph-counter", name: "Paragraph Counter", category: "Text", subcategory: "Counting", description: "Count paragraphs", icon: "AlignJustify", route: "/text/paragraph-counter", tags: ["paragraph", "count"] },
  
  { slug: "case-converter", name: "Case Converter", category: "Text", subcategory: "Formatting", description: "Change text case", icon: "CaseUpper", route: "/text/case-converter", tags: ["case", "convert"] },
  { slug: "remove-duplicate-lines", name: "Remove Duplicate Lines", category: "Text", subcategory: "Formatting", description: "Remove duplicates", icon: "ListMinus", route: "/text/remove-duplicate-lines", tags: ["duplicate", "remove"] },
  { slug: "remove-empty-lines", name: "Remove Empty Lines", category: "Text", subcategory: "Formatting", description: "Remove empty lines", icon: "Delete", route: "/text/remove-empty-lines", tags: ["empty", "remove"] },
  { slug: "text-diff", name: "Text Diff", category: "Text", subcategory: "Comparison", description: "Compare text easily", icon: "Diff", route: "/text/text-diff", tags: ["text", "diff"] },
];
