import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug function to inspect Excel structure
function debugExcelStructure(filePath) {
  try {
    console.log('🔍 Debugging Excel file structure...');
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('Sheet name:', sheetName);
    
    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log('Sheet range:', worksheet['!ref']);
    console.log('Rows:', range.e.r + 1, 'Columns:', range.e.c + 1);
    
    // Check first 15 rows to understand structure
    console.log('\n📋 First 15 rows structure:');
    for (let row = 0; row < Math.min(15, range.e.r + 1); row++) {
      const rowData = [];
      for (let col = 0; col < Math.min(10, range.e.c + 1); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? String(cell.v).substring(0, 30) : '');
      }
      console.log(`Row ${row}:`, rowData);
    }
    
    // Try different header rows
    console.log('\n🔍 Testing different header rows:');
    for (let headerRow = 4; headerRow <= 10; headerRow++) {
      try {
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          range: headerRow
        });
        
        if (jsonData.length > 0) {
          const headers = jsonData[0];
          const validHeaders = headers.filter(h => h && String(h).trim() !== '');
          console.log(`Header row ${headerRow}: ${validHeaders.length} valid headers`);
          if (validHeaders.length > 5) {
            console.log(`  Sample headers: ${validHeaders.slice(0, 5).map(h => String(h).substring(0, 20))}`);
          }
        }
      } catch (e) {
        console.log(`Header row ${headerRow}: Error - ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error debugging Excel:', error);
  }
}

const REGULATION_DEFINITIONS = {
  'I': 'Diizinkan/diperbolehkan',
  'T': 'Pemanfaatan bersyarat secara terbatas',
  'T1': 'Terbatas dengan pembatasan intensitas 20% pembangunan pada suatu kegiatan di luar zona/sub zona di dalam sebuah kaveling/persil',
  'T2': 'Terbatas waktu pengoperasian pukul 07.00 – 24.00 untuk kegiatan di luar zona/sub zona atau sesuai dengan aturan yang berlaku',
  'T3': 'Terbatas dengan jarak minimal 100 meter untuk kegiatan sejenis dalam zona',
  'B': 'Pemanfaatan Bersyarat Tertentu',
  'B1': 'Diperbolehkan dengan syarat harus memiliki bukti izin pemanfaatan beserta persetujuan dari warga/ketua Rukun Tetangga, instansi yang berwenang, serta Forum Penataan Ruang (FPR) jika dibutuhkan',
  'B2': 'Diperbolehkan dengan syarat harus menyediakan lahan parkir dan/atau ruang terbuka hijau dalam kavling/persil',
  'B3': 'Diperbolehkan dengan syarat harus mempertimbangkan aspek kebersihan, kesehatan, keamanan dan ketertiban dengan menyediakan sarana dan prasarana minimal',
  'X': 'Pemanfaatan yang tidak diperbolehkan'
};

function processExcelFile(filePath) {
  try {
    console.log('\n📊 Processing Excel file for data extraction...');
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Based on previous analysis, try header row 4 (0-indexed)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      range: 4 // Start from row 5 (0-indexed as 4)
    });
    
    console.log('Data rows found:', jsonData.length);
    
    if (jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }
    
    // Get headers from first row
    const headers = jsonData[0];
    console.log('Total headers:', headers.length);
    
    // Find zone columns - look for meaningful zone names
    const zones = [];
    const zoneStartIndex = 3; // Skip first 3 columns
    
    for (let i = zoneStartIndex; i < headers.length; i++) {
      const header = headers[i];
      if (header && typeof header === 'string') {
        const cleanHeader = header.trim();
        // Check if it's a zone name (contains keywords like 'Zona', 'Hutan', 'Ruang', etc.)
        if (cleanHeader.length > 0 && 
            (cleanHeader.includes('Zona') || 
             cleanHeader.includes('Hutan') || 
             cleanHeader.includes('Ruang') || 
             cleanHeader.includes('Kawasan') ||
             cleanHeader.includes('Ekosistem') ||
             cleanHeader.includes('Peruntukan') ||
             cleanHeader.includes('Cagar') ||
             cleanHeader.includes('Badan'))) {
          zones.push(cleanHeader);
        }
      }
    }
    
    console.log('Valid zones found:', zones.length);
    console.log('Sample zones:', zones.slice(0, 5));
    
    // Process activities
    const activities = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0]) continue;
      
      const activity = String(row[0]).trim();
      if (!activity || activity === '' || activity === 'undefined') continue;
      
      const zoneData = {};
      
      // Map zones to their regulation codes
      zones.forEach((zone, zoneIndex) => {
        // Find the actual column index for this zone
        const zoneColumnIndex = headers.indexOf(zone);
        if (zoneColumnIndex >= 0) {
          const cellValue = row[zoneColumnIndex];
          if (cellValue && cellValue !== 'X' && String(cellValue).trim() !== '') {
            zoneData[zone] = String(cellValue).trim();
          }
        }
      });
      
      if (Object.keys(zoneData).length > 0) {
        activities.push({
          activity,
          zones: zoneData
        });
      }
    }
    
    console.log('Activities with zone data:', activities.length);
    
    return {
      activities: activities,
      zones: zones,
      regulations: REGULATION_DEFINITIONS
    };
    
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw error;
  }
}

// Main execution
const excelPath = path.join(__dirname, '..', 'RDTR BUILDER TRIKORA', '3. ITBX LAMPIRAN XIV KETENTUAN KEGIATAN DAN PENGGUNAAN LAHAN (1) - Copy.xlsx');
const outputPath = path.join(__dirname, 'app', 'data', 'rdtr-data.json');

// Create data directory if it doesn't exist
const dataDir = path.dirname(outputPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  console.log('🚀 Starting RDTR data processing...');
  console.log('Excel file path:', excelPath);
  
  // Check if file exists
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath);
    process.exit(1);
  }
  
  // First debug the structure
  debugExcelStructure(excelPath);
  
  // Then process the data
  const processedData = processExcelFile(excelPath);
  
  // Save processed data
  fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf-8');
  console.log(`\n💾 Processed data saved to: ${outputPath}`);
  
  console.log('\n✅ Processing completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Activities: ${processedData.activities.length}`);
  console.log(`   - Zones: ${processedData.zones.length}`);
  console.log(`   - Regulation types: ${Object.keys(processedData.regulations).length}`);
  
  if (processedData.activities.length > 0) {
    console.log('\n📋 Sample activities:');
    processedData.activities.slice(0, 3).forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.activity}`);
      console.log(`      Zones with regulations: ${Object.keys(activity.zones).length}`);
      const sampleZones = Object.entries(activity.zones).slice(0, 2);
      sampleZones.forEach(([zone, regulation]) => {
        console.log(`         - ${zone}: ${regulation}`);
      });
    });
  }
  
  if (processedData.zones.length > 0) {
    console.log('\n🏢 Available zones:');
    processedData.zones.slice(0, 10).forEach((zone, index) => {
      console.log(`   ${index + 1}. ${zone}`);
    });
  }
  
} catch (error) {
  console.error('❌ Error processing RDTR data:', error);
  process.exit(1);
}