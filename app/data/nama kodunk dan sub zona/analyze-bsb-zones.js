import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the BSB Excel file
const excelFilePath = path.join(__dirname, 'bsb.xlsx');

console.log('🔍 Analyzing BSB Zones Excel File...\n');

try {
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log('📊 WORKBOOK ANALYSIS:');
    console.log('- Sheet names:', workbook.SheetNames);
    console.log('- Number of sheets:', workbook.SheetNames.length);
    
    // Analyze each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\n📋 SHEET ${index + 1}: "${sheetName}"`);
        console.log('=' .repeat(50));
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Get sheet range
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        console.log(`- Range: ${worksheet['!ref']}`);
        console.log(`- Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}`);
        
        // Convert to array of arrays for analysis
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Also try converting to objects to see if there's data
        const objectData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        console.log(`\n🔍 DATA STRUCTURE ANALYSIS:`);
        console.log(`- Total rows with data (array): ${data.length}`);
        console.log(`- Total rows with data (object): ${objectData.length}`);
        
        // Check if the sheet is actually empty or has hidden data
        console.log(`- Raw sheet keys:`, Object.keys(worksheet).slice(0, 20));
        
        // Try to find any cell with data
        let foundData = false;
        for (let row = 0; row < 100; row++) {
            for (let col = 0; col < 50; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = worksheet[cellAddress];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
                    console.log(`- Found data at ${cellAddress}: "${cell.v}" (type: ${typeof cell.v})`);
                    foundData = true;
                    if (foundData) break;
                }
            }
            if (foundData) break;
        }
        
        // Show first 10 rows to understand structure
        console.log(`\n📝 SAMPLE DATA (First 10 rows):`);
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (row && row.length > 0) {
                console.log(`Row ${i + 1}: [${row.length} cols] ${JSON.stringify(row.slice(0, 5))}${row.length > 5 ? '...' : ''}`);
            }
        }
        
        // Look for patterns in headers
        console.log(`\n🏷️  HEADER ANALYSIS:`);
        let headerRow = -1;
        for (let i = 0; i < Math.min(20, data.length); i++) {
            const row = data[i];
            if (row && row.length > 0) {
                const rowStr = row.join('|').toLowerCase();
                if (rowStr.includes('zona') || rowStr.includes('kodungk') || rowStr.includes('sub') || rowStr.includes('kode')) {
                    console.log(`Potential header at row ${i + 1}: ${JSON.stringify(row)}`);
                    if (headerRow === -1) headerRow = i;
                }
            }
        }
        
        // Analyze column patterns if header found
        if (headerRow >= 0) {
            console.log(`\n📊 COLUMN ANALYSIS (Based on row ${headerRow + 1}):`);
            const headers = data[headerRow];
            headers.forEach((header, colIndex) => {
                if (header) {
                    console.log(`Column ${colIndex + 1}: "${header}"`);
                    
                    // Sample some values from this column
                    const sampleValues = [];
                    for (let rowIndex = headerRow + 1; rowIndex < Math.min(headerRow + 11, data.length); rowIndex++) {
                        const value = data[rowIndex] ? data[rowIndex][colIndex] : undefined;
                        if (value !== undefined && value !== null && value !== '') {
                            sampleValues.push(value);
                        }
                    }
                    if (sampleValues.length > 0) {
                        console.log(`  Sample values: ${JSON.stringify(sampleValues.slice(0, 5))}`);
                    }
                }
            });
        }
        
        // Look for unique patterns in data
        console.log(`\n🔍 UNIQUE VALUE ANALYSIS:`);
        const uniquePatterns = new Set();
        const columnData = {};
        
        for (let rowIndex = Math.max(0, headerRow + 1); rowIndex < Math.min(data.length, headerRow + 100); rowIndex++) {
            const row = data[rowIndex];
            if (row && row.length > 0) {
                row.forEach((cell, colIndex) => {
                    if (cell !== undefined && cell !== null && cell !== '') {
                        if (!columnData[colIndex]) columnData[colIndex] = new Set();
                        columnData[colIndex].add(String(cell));
                        
                        // Look for zone-like patterns
                        const cellStr = String(cell);
                        if (cellStr.match(/^[A-Z-]+(\.\d+)*$/)) {
                            uniquePatterns.add(cellStr);
                        }
                    }
                });
            }
        }
        
        console.log(`- Found ${uniquePatterns.size} unique zone-like patterns`);
        if (uniquePatterns.size > 0) {
            const sortedPatterns = Array.from(uniquePatterns).sort();
            console.log(`- Sample patterns: ${JSON.stringify(sortedPatterns.slice(0, 10))}`);
        }
        
        // Show column statistics
        console.log(`\n📈 COLUMN STATISTICS:`);
        Object.entries(columnData).forEach(([colIndex, values]) => {
            console.log(`Column ${parseInt(colIndex) + 1}: ${values.size} unique values`);
            if (values.size <= 20) {
                console.log(`  Values: ${JSON.stringify(Array.from(values).slice(0, 10))}`);
            }
        });
    });
    
    console.log('\n✅ Analysis complete!');
    
} catch (error) {
    console.error('❌ Error analyzing Excel file:', error.message);
    console.error('Stack trace:', error.stack);
}