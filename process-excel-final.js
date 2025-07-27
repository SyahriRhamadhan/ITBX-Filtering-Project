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
    console.log('📊 Processing Excel file...');
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get all data as array of arrays
    const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Total rows in sheet:', allData.length);
    
    // Based on debug output, headers are in rows 10-11, data starts at row 14
    const headerRow1 = allData[10] || []; // Row 11: ['No', 'Kode', 'Kegiatan', 'Zona Lindung', ...]
    const headerRow2 = allData[11] || []; // Row 12: Zone names
    const headerRow3 = allData[12] || []; // Row 13: Sub-zone names
    const headerRow4 = allData[13] || []; // Row 14: Zone codes
    
    console.log('Header row 1 length:', headerRow1.length);
    console.log('Header row 2 length:', headerRow2.length);
    
    // Build zone names by combining headers
    const zones = [];
    const zoneMapping = {}; // Map column index to zone name
    
    for (let i = 3; i < Math.max(headerRow1.length, headerRow2.length, headerRow3.length); i++) {
      let zoneName = '';
      
      // Try to get zone name from different header rows
      if (headerRow2[i] && String(headerRow2[i]).trim()) {
        zoneName = String(headerRow2[i]).trim();
      } else if (headerRow1[i] && String(headerRow1[i]).trim()) {
        zoneName = String(headerRow1[i]).trim();
      } else if (headerRow3[i] && String(headerRow3[i]).trim()) {
        zoneName = String(headerRow3[i]).trim();
      }
      
      // Add sub-zone info if available
      if (headerRow3[i] && String(headerRow3[i]).trim() && 
          headerRow3[i] !== zoneName && 
          !zoneName.includes(String(headerRow3[i]).trim())) {
        zoneName += ` - ${String(headerRow3[i]).trim()}`;
      }
      
      if (zoneName && zoneName !== '' && !zones.includes(zoneName)) {
        zones.push(zoneName);
        zoneMapping[i] = zoneName;
      }
    }
    
    console.log('Zones found:', zones.length);
    console.log('Sample zones:', zones.slice(0, 5));
    
    // Process activities starting from row 14 (index 14)
    const activities = [];
    
    for (let i = 14; i < allData.length; i++) {
      const row = allData[i];
      if (!row || !row[2]) continue; // Column 2 contains activity name
      
      const activity = String(row[2]).trim();
      if (!activity || activity === '' || activity === 'undefined') continue;
      
      const zoneData = {};
      
      // Check each zone column
      Object.entries(zoneMapping).forEach(([colIndex, zoneName]) => {
        const cellValue = row[parseInt(colIndex)];
        if (cellValue && cellValue !== 'X' && String(cellValue).trim() !== '') {
          zoneData[zoneName] = String(cellValue).trim();
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
  console.log('🚀 Starting RDTR data processing...');
  console.log('Excel file path:', excelPath);
  
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath);
    process.exit(1);
  }
  
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