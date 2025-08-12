import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log('Reading Excel file:', filePath);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet (ITBX TRIKORA)
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('Sheet name:', sheetName);
    
    // Convert to JSON with header row 7 (0-indexed as 6)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      range: 7 // Start from row 8 (0-indexed as 7)
    });
    
    console.log('Total rows found:', jsonData.length);
    
    if (jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }
    
    // Get headers (zone names) from the first row
    const headers = jsonData[0];
    console.log('Headers found:', headers.length);
    
    // Find zone columns - skip first few columns that contain metadata
    const zones = [];
    for (let i = 3; i < headers.length; i++) {
      const header = headers[i];
      if (header && typeof header === 'string' && header.trim() !== '' && header !== 'X') {
        zones.push(header.trim());
      }
    }
    
    console.log('Zones found:', zones.length);
    console.log('Sample zones:', zones.slice(0, 5));
    
    // Process activities data
    const activities = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0]) continue; // Skip empty rows
      
      const activity = String(row[0]).trim();
      if (!activity || activity === '' || activity === 'undefined') continue;
      
      const zoneData = {};
      
      // Map each zone to its regulation code
      zones.forEach((zone, zoneIndex) => {
        const cellIndex = zoneIndex + 3; // Offset by 3 for the first 3 columns
        const cellValue = row[cellIndex];
        if (cellValue && cellValue !== 'X' && String(cellValue).trim() !== '') {
          zoneData[zone] = String(cellValue).trim();
        }
      });
      
      if (Object.keys(zoneData).length > 0) {
        activities.push({
          activity,
          zones: zoneData
        });
      }
    }
    
    console.log('Activities processed:', activities.length);
    
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
  console.log('Starting RDTR data processing...');
  console.log('Excel file path:', excelPath);
  console.log('Output path:', outputPath);
  
  // Check if file exists
  if (!fs.existsSync(excelPath)) {
    console.error('Excel file not found at:', excelPath);
    process.exit(1);
  }
  
  const processedData = processExcelFile(excelPath);
  
  // Save processed data
  fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf-8');
  console.log(`Processed data saved to: ${outputPath}`);
  
  console.log('✅ Processing completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Activities: ${processedData.activities.length}`);
  console.log(`   - Zones: ${processedData.zones.length}`);
  console.log(`   - Regulation types: ${Object.keys(processedData.regulations).length}`);
  
  // Show sample data
  console.log('\n📋 Sample activities:');
  processedData.activities.slice(0, 3).forEach((activity, index) => {
    console.log(`   ${index + 1}. ${activity.activity}`);
    console.log(`      Zones: ${Object.keys(activity.zones).length}`);
  });
  
  console.log('\n🏢 Sample zones:');
  processedData.zones.slice(0, 5).forEach((zone, index) => {
    console.log(`   ${index + 1}. ${zone}`);
  });
  
} catch (error) {
  console.error('❌ Error processing RDTR data:', error);
  process.exit(1);
}