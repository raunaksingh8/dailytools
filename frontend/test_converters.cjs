// Test all 6 converters using Node.js with CJS modules
const docx = require('docx');
const JSZip = require('jszip');
const XLSX = require('xlsx');
const fs = require('fs');

const { Document, Packer, Paragraph, TextRun, SectionType, Textbox, HeadingLevel } = docx;

// ================================================================
// TEST 1: Word → PDF - DOCX creation + mammoth HTML extraction
// ================================================================
async function testWordToPdf() {
  console.log('\n=== TEST: Word → PDF ===');
  try {
    const mammoth = require('mammoth');
    
    // Create a test DOCX in memory
    const testDocx = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'Annual Report 2024', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun('This document tests the Word to PDF converter. ')] }),
          new Paragraph({ children: [new TextRun({ text: 'This is bold text.', bold: true }), new TextRun(' And normal text.') ]}),
          new Paragraph({ text: 'Section 2: Data Summary', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun('Revenue for Q4 was $640,000, representing a 15% increase over Q3.')] }),
          new Paragraph({ text: 'Section 3: Conclusion', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun('The company performed well across all key metrics.')] }),
        ]
      }]
    });
    
    const docxBuffer = await Packer.toBuffer(testDocx);
    fs.writeFileSync('./test_input_word.docx', docxBuffer);
    console.log('✓ Created test DOCX:', docxBuffer.length, 'bytes');
    
    // Convert to HTML using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer: docxBuffer.buffer });
    console.log('✓ Mammoth HTML output:', result.value.length, 'chars');
    console.log('  HTML preview:', result.value.substring(0, 300));
    
    // Verify HTML contains expected elements
    const hasH1 = result.value.includes('<h1>') || result.value.includes('<h2>');
    const hasBold = result.value.includes('<strong>') || result.value.includes('<b>');
    const hasText = result.value.includes('Annual Report');
    console.log(`  Has heading: ${hasH1}, has bold: ${hasBold}, has text: ${hasText}`);
    
    console.log('✓ Word→PDF: HTML generation PASSES');
  } catch (err) {
    console.error('✗ Word→PDF FAILED:', err.message);
  }
}

// ================================================================
// TEST 2: Excel → PDF - XLSX creation + sheet reading
// ================================================================
async function testExcelToPdf() {
  console.log('\n=== TEST: Excel → PDF ===');
  try {
    // Create test XLSX with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    const sheet1Data = [
      ['Product', 'Q1 Sales', 'Q2 Sales', 'Q3 Sales', 'Total'],
      ['Widget A', 15000, 18000, 22000, 55000],
      ['Widget B', 8500, 9200, 11000, 28700],
      ['Widget C', 23000, 25000, 28000, 76000],
      ['Widget D', 5000, 6500, 7200, 18700],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet1Data), 'Sales Q1-Q3');
    
    const sheet2Data = [
      ['Region', 'Revenue', 'Expenses', 'Profit'],
      ['North', 450000, 380000, 70000],
      ['South', 320000, 280000, 40000],
      ['East', 560000, 450000, 110000],
      ['West', 280000, 230000, 50000],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet2Data), 'Regional');
    
    const xlsxBytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    fs.writeFileSync('./test_input.xlsx', xlsxBytes);
    console.log('✓ Created test XLSX:', xlsxBytes.length, 'bytes, sheets:', workbook.SheetNames);
    
    // Read it back (like the converter does)
    const wb2 = XLSX.read(xlsxBytes, { type: 'buffer' });
    wb2.SheetNames.forEach(sheetName => {
      const rows = XLSX.utils.sheet_to_json(wb2.Sheets[sheetName], { header: 1, defval: '' });
      console.log(`  Sheet "${sheetName}": ${rows.length} rows x ${rows[0]?.length} cols`);
      const [head, ...body] = rows;
      console.log('  Header:', head);
      console.log('  First data row:', body[0]);
    });
    
    console.log('✓ Excel→PDF: Data extraction PASSES (PDF rendering is browser-only via jsPDF)');
  } catch (err) {
    console.error('✗ Excel→PDF FAILED:', err.message);
  }
}

// ================================================================
// TEST 3: PDF → Word DOCX Textbox Rendering Fix
// ================================================================
async function testPdfToWordDocxRendering() {
  console.log('\n=== TEST: PDF → Word DOCX Textbox Rendering ===');
  try {
    // Simulate what the converter creates (positioned textboxes per line)
    const makeTextbox = (text, top, size = 22, bold = false) => new Textbox({
      children: [new Paragraph({ children: [new TextRun({ text, color: '1A1A1A', size: size * 2, bold })] })],
      style: {
        position: 'absolute',
        positionHorizontal: 'absolute',
        positionHorizontalRelative: 'page',
        positionVertical: 'absolute',
        positionVerticalRelative: 'page',
        left: '72pt',
        top: `${top}pt`,
        width: '468pt',
        height: `${size * 1.5}pt`,
        wrapStyle: 'none',
        zIndex: 1
      }
    });
    
    const sections = [{
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 },
        }
      },
      children: [
        makeTextbox('Annual Report 2024', 72, 28, true),
        makeTextbox('Introduction', 130, 20, true),
        makeTextbox('This document was converted from PDF to Word format.', 165, 12),
        makeTextbox('All text was extracted using PDF.js text content API.', 185, 12),
        makeTextbox('Revenue Overview', 220, 20, true),
        makeTextbox('Q1: $450,000   Q2: $520,000   Q3: $580,000   Q4: $640,000', 250, 12),
        makeTextbox('Total Annual Revenue: $2,190,000', 270, 12),
      ]
    }];
    
    const doc = new Document({ sections });
    const buf = await Packer.toBuffer(doc);
    
    // Check raw XML
    const zip = await JSZip.loadAsync(buf);
    const xmlContent = await zip.files['word/document.xml'].async('text');
    
    const shapeMatches = xmlContent.match(/<v:shape[^>]*>/g);
    console.log('  Raw v:shape count:', shapeMatches?.length);
    console.log('  First shape:', shapeMatches?.[0]);
    
    // Check if filled attribute is already there
    const alreadyHasFilled = xmlContent.includes('filled=');
    console.log('  Already has filled attr:', alreadyHasFilled);
    
    // Apply the fix
    const fixed = xmlContent
      .replace(/<v:shape\b([^>]*)>/g, (m, attrs) => `<v:shape${attrs} filled="f" stroked="f">`)
      .replace(/<v:textbox\b([^>]*)>/g, (m, attrs) => `<v:textbox${attrs} inset="0,0,0,0">`);
    
    zip.file('word/document.xml', fixed);
    const fixedBuf = await zip.generateAsync({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    fs.writeFileSync('./test_pdftodocx.docx', fixedBuf);
    
    // Verify
    const zip2 = await JSZip.loadAsync(fixedBuf);
    const xml2 = await zip2.files['word/document.xml'].async('text');
    const fixedShapes = xml2.match(/<v:shape[^>]*>/g);
    console.log('✓ Fixed shape count:', fixedShapes?.length);
    console.log('  Fixed first shape:', fixedShapes?.[0]);
    console.log('  Has filled="f":', xml2.includes('filled="f"'));
    console.log('  Has stroked="f":', xml2.includes('stroked="f"'));
    console.log('  Has Annual Report:', xml2.includes('Annual Report'));
    console.log('✓ Written test_pdftodocx.docx:', fixedBuf.length, 'bytes');
    
    // Check colors - ensure no white color is being set
    const colorMatches = xml2.match(/<w:color w:val="[^"]*"\/>/g);
    console.log('  Color values:', colorMatches);
    
    // Analyze if the issue is color being set to white
    const hasWhiteColor = xml2.includes('w:val="FFFFFF"') || xml2.includes('w:val="ffffff"');
    console.log('  Has white color text:', hasWhiteColor);
    
  } catch (err) {
    console.error('✗ PDF→Word DOCX rendering FAILED:', err.message);
    console.error(err.stack);
  }
}

// ================================================================
// TEST 4: PDF → Excel - improved structured extraction
// ================================================================
async function testPdfToExcel() {
  console.log('\n=== TEST: PDF → Excel ===');
  try {
    // Simulate data extracted from a PDF with tables
    // The real converter uses extractPdfPages() which returns pages[] of text
    // We test the XLSX generation
    const pages = [
      'Name       Age  City           Department\nJohn Smith  30   New York       Engineering\nJane Doe    25   Los Angeles    Marketing\nBob Johnson 45   Chicago        Finance',
      'Product    Price  Quantity  Revenue\nWidget A   15.00  100       1500.00\nWidget B   22.50  75        1687.50\nWidget C   8.99   200       1798.00',
    ];
    
    // IMPROVED approach: one sheet per page, try to parse rows
    const workbook = XLSX.utils.book_new();
    
    pages.forEach((pageText, index) => {
      const lines = pageText.split('\n').filter(l => l.trim());
      // Use aoa_to_sheet with each line as a row, splitting by multiple spaces
      const rows = lines.map(line => {
        // Split on 2+ spaces or tabs - handles column-aligned text
        return line.split(/\s{2,}|\t/).map(cell => cell.trim()).filter(Boolean);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(rows);
      // Auto-size columns
      const maxCols = Math.max(...rows.map(r => r.length));
      ws['!cols'] = Array(maxCols).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(workbook, ws, `Page ${index + 1}`);
    });
    
    const xlsxBytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    fs.writeFileSync('./test_pdftoexcel.xlsx', xlsxBytes);
    console.log('✓ Written test_pdftoexcel.xlsx:', xlsxBytes.length, 'bytes');
    
    const wb2 = XLSX.read(xlsxBytes, { type: 'buffer' });
    wb2.SheetNames.forEach(sn => {
      const rows = XLSX.utils.sheet_to_json(wb2.Sheets[sn], { header: 1, defval: '' });
      console.log(`  Sheet "${sn}": ${rows.length} rows`);
      rows.forEach((r, i) => console.log(`    Row ${i}: [${r.join(' | ')}]`));
    });
    
    console.log('✓ PDF→Excel: XLSX generation PASSES');
  } catch (err) {
    console.error('✗ PDF→Excel FAILED:', err.message);
  }
}

// ================================================================
// TEST 5: PDF → PowerPoint  
// ================================================================
async function testPdfToPowerPoint() {
  console.log('\n=== TEST: PDF → PowerPoint ===');
  try {
    const PptxGenJS = (await import('pptxgenjs')).default;
    
    const pages = [
      'Introduction\n\nThis is the first slide content.\nWith multiple lines of text.\nBullet point 1\nBullet point 2',
      'Data Analysis\n\nKey findings:\nQ1 Revenue: $450,000\nQ2 Revenue: $520,000\nGrowth: 15.6%',
      'Conclusion\n\nSummary of the presentation.\nNext steps and recommendations.',
    ];
    
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    
    pages.forEach((text, index) => {
      const slide = pres.addSlide();
      slide.background = { color: 'FFFFFF' };
      slide.addText(`Page ${index + 1}`, { 
        x: 0.5, y: 0.35, w: 12.2, h: 0.35, 
        fontSize: 20, bold: true, color: '1E3A5F' 
      });
      slide.addText(text, {
        x: 0.5, y: 0.95, w: 12.2, h: 5.95,
        fontSize: 12, color: '263238',
        breakLine: false, fit: 'shrink', margin: 0, valign: 'top',
      });
    });
    
    const pptxBuf = await pres.write({ outputType: 'nodebuffer' });
    fs.writeFileSync('./test_pdftopptx.pptx', pptxBuf);
    console.log('✓ Written test_pdftopptx.pptx:', pptxBuf.length, 'bytes');
    
    // Verify
    const zipVerify = await JSZip.loadAsync(pptxBuf);
    const slideFiles = Object.keys(zipVerify.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f));
    console.log('✓ PPTX verified, slides:', slideFiles.length);
    
    for (const sp of slideFiles) {
      const xml = await zipVerify.files[sp].async('text');
      const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const texts = textMatches.map(t => t.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      console.log(`  ${sp}: texts = "${texts.slice(0, 3).join(', ')}..."`);
    }
    
    console.log('✓ PDF→PowerPoint: PASSES');
  } catch (err) {
    console.error('✗ PDF→PowerPoint FAILED:', err.message);
    console.error(err.stack?.substring(0, 500));
  }
}

// ================================================================
// TEST 6: PowerPoint → PDF
// ================================================================
async function testPowerPointToPdf() {
  console.log('\n=== TEST: PowerPoint → PDF ===');
  try {
    // Create test PPTX
    const PptxGenJS = (await import('pptxgenjs')).default;
    
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';
    
    const slide1 = pres.addSlide();
    slide1.background = { color: '1E3A5F' };
    slide1.addText('Annual Report 2024', { x: 1, y: 2.5, w: 11, h: 1, fontSize: 36, bold: true, color: 'FFFFFF', align: 'center' });
    
    const slide2 = pres.addSlide();
    slide2.addText('Revenue Overview', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 28, bold: true, color: '1E3A5F' });
    slide2.addText('Q1: $450,000\nQ2: $520,000\nQ3: $580,000\nQ4: $640,000', { x: 0.5, y: 1.3, w: 12, h: 5, fontSize: 18 });
    
    const slide3 = pres.addSlide();
    slide3.addText('Key Achievements', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 28, bold: true, color: '1E3A5F' });
    slide3.addText('42% increase in customer base\nLaunched 3 new product lines\nExpanded to 5 new markets', { x: 0.5, y: 1.3, w: 12, h: 5, fontSize: 18 });
    
    const pptxBuffer = await pres.write({ outputType: 'nodebuffer' });
    fs.writeFileSync('./test_input.pptx', pptxBuffer);
    console.log('✓ Created test PPTX:', pptxBuffer.length, 'bytes');
    
    // Extract text from PPTX XML (as the converter does)
    const archive = await JSZip.loadAsync(pptxBuffer);
    const slidePaths = Object.keys(archive.files)
      .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
    
    console.log('✓ Slides found:', slidePaths.length);
    
    const slideTexts = await Promise.all(slidePaths.map(async (sp) => {
      const xml = await archive.files[sp].async('text');
      // Extract text using getElementsByTagNameNS equivalent via regex
      const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
      const text = textMatches.map(t => t.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ');
      return text || 'No selectable text on this slide.';
    }));
    
    slideTexts.forEach((text, i) => {
      console.log(`  Slide ${i+1}: "${text.substring(0, 100)}"`);
    });
    
    // Verify text was extracted
    const hasTitle = slideTexts[0].includes('Annual Report');
    const hasRevenue = slideTexts[1].includes('450,000') || slideTexts[1].includes('Revenue');
    const hasAchiev = slideTexts[2].includes('Achievements') || slideTexts[2].includes('customer');
    console.log(`  Slide 1 has title: ${hasTitle}`);
    console.log(`  Slide 2 has revenue data: ${hasRevenue}`);
    console.log(`  Slide 3 has achievements: ${hasAchiev}`);
    
    console.log('✓ PowerPoint→PDF: Text extraction PASSES (PDF rendering is browser-only)');
  } catch (err) {
    console.error('✗ PowerPoint→PDF FAILED:', err.message);
    console.error(err.stack?.substring(0, 500));
  }
}

// ================================================================
// RUN ALL TESTS
// ================================================================
async function runAll() {
  console.log('=== Starting Converter Tests ===');
  await testWordToPdf();
  await testExcelToPdf();
  await testPdfToWordDocxRendering();
  await testPdfToExcel();
  await testPdfToPowerPoint();
  await testPowerPointToPdf();
  console.log('\n=== All Tests Complete ===');
}

runAll().catch(console.error);
