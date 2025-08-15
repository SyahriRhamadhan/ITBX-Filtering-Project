import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeUjiTitikExcel(filePath) {
  try {
    console.log('📊 Analyzing Trikora Uji Titik Excel file...');
    console.log('File path:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    console.log('\n📋 Available sheets:', workbook.SheetNames);
    
    // Analyze each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n=== SHEET ${index + 1}: ${sheetName} ===`);
      
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      console.log(`Range: ${worksheet['!ref']} (${range.e.r + 1} rows, ${range.e.c + 1} columns)`);
      
      // Convert to array format to analyze structure
      const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`Total data rows: ${allData.length}`);
      
      // Show first 20 rows to understand structure
      console.log('\n📋 First 20 rows structure:');
      for (let i = 0; i < Math.min(20, allData.length); i++) {
        const row = allData[i];
        if (row && row.length > 0) {
          // Show first 15 columns of each row to see more structure
          const displayRow = row.slice(0, 15).map(cell => {
            if (cell === null || cell === undefined) return 'NULL';
            const str = String(cell).trim();
            return str.length > 15 ? str.substring(0, 15) + '...' : str;
          });
          console.log(`Row ${i + 1}: [${displayRow.join(' | ')}]`);
        } else {
          console.log(`Row ${i + 1}: [EMPTY]`);
        }
      }
      
      // Look for potential header rows
      console.log('\n🔍 Looking for header patterns...');
      for (let i = 0; i < Math.min(15, allData.length); i++) {
        const row = allData[i];
        if (row && row.length > 3) {
          const hasHeaders = row.some(cell => {
            if (!cell) return false;
            const str = String(cell).toLowerCase();
            return str.includes('no') || str.includes('kode') || str.includes('kegiatan') || 
                   str.includes('zona') || str.includes('kawasan') || str.includes('aktivitas') ||
                   str.includes('nama') || str.includes('luas') || str.includes('ketentuan');
          });
          
          if (hasHeaders) {
            console.log(`  Potential header row ${i + 1}:`);
            row.forEach((cell, colIndex) => {
              if (cell && String(cell).trim() !== '') {
                console.log(`    Column ${colIndex + 1}: "${String(cell).trim()}"`);
              }
            });
          }
        }
      }
      
      // Show detailed column structure for first few rows
      console.log('\n📊 Detailed column structure (first 5 rows):');
      for (let i = 0; i < Math.min(5, allData.length); i++) {
        const row = allData[i];
        if (row && row.length > 0) {
          console.log(`\n--- Row ${i + 1} ---`);
          for (let j = 0; j < Math.min(15, row.length); j++) {
            const cell = row[j];
            if (cell && String(cell).trim() !== '') {
              console.log(`  Col ${String.fromCharCode(65 + j)} (${j + 1}): "${String(cell).trim()}"`);
            } else {
              console.log(`  Col ${String.fromCharCode(65 + j)} (${j + 1}): [EMPTY]`);
            }
          }
        }
      }
      
      console.log('\n📊 All non-empty headers from first 15 rows:');
      const allHeaders = new Set();
      for (let i = 0; i < Math.min(15, allData.length); i++) {
        const row = allData[i];
        if (row) {
          row.forEach((cell, colIndex) => {
            if (cell && String(cell).trim() !== '' && String(cell).trim().length > 1) {
              allHeaders.add(`Col ${colIndex + 1}: "${String(cell).trim()}"`);
            }
          });
        }
      }
      
      Array.from(allHeaders).sort().forEach(header => {
        console.log(`  ${header}`);
      });
      
      // Only analyze first 2 sheets as requested (1-ah sampai 2-ah)
      if (index >= 1) {
        console.log('\n⏹️ Stopping analysis after 2 sheets as requested.');
        return;
      }
    });
    
  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error);
    throw error;
  }
}

// Main execution
const filePath = path.join(__dirname, 'app', 'data', 'uji titik', 'trikora-uji-titik-generated.xlsx');

try {
  console.log('🚀 Starting Trikora Uji Titik Excel analysis...');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('❌ Excel file not found at:', filePath);
    process.exit(1);
  }
  
  analyzeUjiTitikExcel(filePath);
  
  console.log('\n✅ Analysis completed successfully!');
  
} catch (error) {
  console.error('❌ Error during analysis:', error);
  process.exit(1);
}