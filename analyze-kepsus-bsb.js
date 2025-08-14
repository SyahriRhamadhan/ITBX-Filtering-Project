import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function debugExcelStructure(workbook, sheetName) {
  console.log('\n=== DEBUGGING BSB EXCEL STRUCTURE ===');
  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  console.log(`Sheet range: ${worksheet['!ref']}`);
  console.log(`Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}`);
  
  // Show first 10 rows to understand structure
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log('\nFirst 10 rows:');
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    console.log(`Row ${i + 1}:`, jsonData[i]);
  }
  
  // Show potential header patterns in first 3 rows
  console.log('\nPotential header patterns in first 3 rows:');
  for (let i = 0; i < Math.min(3, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && row.length > 0) {
      console.log(`Row ${i + 1} pattern:`, row.map(cell => 
        cell ? cell.toString().substring(0, 20) + (cell.toString().length > 20 ? '...' : '') : 'EMPTY'
      ));
    }
  }
}

function extractTextContent(workbook, sheetName) {
  console.log('\n=== EXTRACTING BSB TEXT CONTENT ===');
  const worksheet = workbook.Sheets[sheetName];
  const textContent = [];
  
  // Get all cells with text
  for (const cellAddress in worksheet) {
    if (cellAddress[0] === '!') continue; // Skip metadata
    
    const cell = worksheet[cellAddress];
    if (cell && cell.v && typeof cell.v === 'string' && cell.v.trim().length > 0) {
      textContent.push(cell.v.trim());
    }
  }
  
  console.log(`Extracted ${textContent.length} text entries`);
  return textContent;
}

function processKepsusBsbData(workbook, sheetName) {
  console.log('\n=== PROCESSING BSB KEPSUS DATA ===');
  
  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Find header row that contains the actual column names
  let headerRowIndex = -1;
  let headers = [];
  
  // Look for the exact header pattern based on the provided example
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && row.length >= 7) {
      // Check for exact header pattern: Tabel, Kawasan..., Nama Sub-Zona, Kode SWP, Kode Blok, Luas (Ha), Ketentuan
      const col0 = row[0] ? row[0].toString().toLowerCase() : '';
      const col2 = row[2] ? row[2].toString().toLowerCase() : '';
      const col3 = row[3] ? row[3].toString().toLowerCase() : '';
      const col4 = row[4] ? row[4].toString().toLowerCase() : '';
      const col5 = row[5] ? row[5].toString().toLowerCase() : '';
      const col6 = row[6] ? row[6].toString().toLowerCase() : '';
      
      if (col0.includes('tabel') && 
          col2.includes('nama') && col2.includes('zona') &&
          col3.includes('kode') && col3.includes('swp') &&
          col4.includes('kode') && col4.includes('blok') &&
          col5.includes('luas') &&
          col6.includes('ketentuan')) {
        headerRowIndex = i;
        headers = row.map(h => h || '');
        console.log(`Found headers at row ${i + 1}:`, headers);
        break;
      }
    }
  }
  
  // If no proper header found, use default structure based on the example
  if (headerRowIndex === -1) {
    console.log('No clear header row found, using default structure based on example format');
    headerRowIndex = 0;
    headers = ['Tabel', 'Kawasan Keselamatan Operasi Penerbangan', 'Nama Sub-Zona', 'Kode SWP', 'Kode Blok', 'Luas (Ha)', 'Ketentuan'];
  }
  
  // Process data rows
  const activities = [];
  const zones = ['Luas (Ha)', 'Ketentuan'];
  const regulations = {};
  
  console.log(`Processing ${jsonData.length - headerRowIndex - 1} data rows...`);
  
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 7) continue;
    
    // Skip empty rows
    const hasData = row.some(cell => cell && cell.toString().trim() !== '');
    if (!hasData) continue;
    
    // Extract data based on 7-column structure (0-indexed)
    const tabel = row[0] || '';
    const kawasanType = row[1] || '';
    const namaSubZona = row[2] || '';
    const kodeSWP = row[3] || '';
    const kodeBlok = row[4] || '';
    const luas = row[5] || '';
    const ketentuan = row[6] || '';
    
    // Skip only actual header rows, not data rows
    const namaStr = namaSubZona.toString().toLowerCase();
    const tabelStr = tabel.toString().toLowerCase();
    
    // Skip only if it's clearly a header row (contains "nama" and "zona" together)
    if (namaStr.includes('nama') && namaStr.includes('zona')) {
      continue;
    }
    
    // Skip rows that are clearly empty or too short
    if (!namaSubZona || namaSubZona.toString().trim().length < 3) {
      continue;
    }
    
    // Skip if all key fields are empty
    if (!namaSubZona.toString().trim() && !kodeSWP.toString().trim() && !luas.toString().trim()) {
      continue;
    }
    
    // Create activity name - use the actual sub-zone name without additional context
    let activityName = namaSubZona.toString().trim();
    
    // Clean up activity name by removing common prefixes
    if (activityName.toLowerCase().startsWith('sub-zona ')) {
      activityName = activityName.substring(9).trim();
    }
    
    // Remove any parenthetical information to keep activity names clean
    const parenIndex = activityName.indexOf('(');
    if (parenIndex > 0) {
      activityName = activityName.substring(0, parenIndex).trim();
    }
    
    // Store regulation if exists
    if (ketentuan && ketentuan.toString().trim() !== '' && ketentuan.toString().trim().length > 10) {
      const regKey = `REG_BSB_${i}`;
      regulations[regKey] = ketentuan.toString().trim();
    }
    
    // Create activity object with proper zone information
    const activity = {
      activity: activityName,
      zones: {
        'Luas (Ha)': luas ? luas.toString().trim() : '',
        'Ketentuan': ketentuan ? ketentuan.toString().trim() : ''
      },
      metadata: {
        tabel: tabel ? tabel.toString().trim() : 'TABEL KETENTUAN KHUSUS BSB',
        kawasanType: kawasanType ? kawasanType.toString().trim() : '',
        kodeSWP: kodeSWP ? kodeSWP.toString().trim() : '',
        kodeBlok: kodeBlok ? kodeBlok.toString().trim() : '',
        source: 'bsb'
      }
    };
    
    activities.push(activity);
  }
  
  console.log(`Processed ${activities.length} BSB activities`);
  console.log(`Generated ${Object.keys(regulations).length} BSB regulations`);
  
  return {
    activities,
    zones,
    regulations,
    metadata: {
      totalRows: jsonData.length,
      headerRowIndex: headerRowIndex + 1,
      dataStartIndex: headerRowIndex + 2,
      processedAt: new Date().toISOString(),
      headers: headers,
      source: 'bsb',
      sourceFile: 'kepsus bsb.xlsx'
    }
  };
}

function main() {
  try {
    console.log('Starting BSB Kepsus Excel analysis...');
    
    // Read the Excel file
    const excelPath = path.join(__dirname, 'app', 'data', 'kepsus', 'kepsus bsb.xlsx');
    console.log(`Reading Excel file: ${excelPath}`);
    
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found: ${excelPath}`);
    }
    
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;
    console.log('Available sheets:', sheetNames);
    
    const sheetName = sheetNames[0]; // Use first sheet
    console.log(`Processing sheet: ${sheetName}`);
    
    // Debug structure
    debugExcelStructure(workbook, sheetName);
    
    // Extract text content
    const textContent = extractTextContent(workbook, sheetName);
    
    // Process the data
    const result = processKepsusBsbData(workbook, sheetName);
    
    // Save to JSON file
    const outputPath = path.join(__dirname, 'app', 'data', 'kepsus-bsb-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    
    console.log(`\n=== BSB SUMMARY ===`);
    console.log(`Total rows: ${result.metadata.totalRows}`);
    console.log(`Headers at row: ${result.metadata.headerRowIndex}`);
    console.log(`Data starts at row: ${result.metadata.dataStartIndex}`);
    console.log(`BSB Activities processed: ${result.activities.length}`);
    console.log(`BSB Regulations generated: ${Object.keys(result.regulations).length}`);
    console.log(`Output saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error processing BSB Excel file:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();

export { processKepsusBsbData };