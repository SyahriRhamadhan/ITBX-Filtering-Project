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

function processExcelFileBSB(filePath) {
  try {
    console.log('📊 Processing BSB Excel file...');
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get all data as array of arrays
    const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Total rows in sheet:', allData.length);
    
    // Debug: Print first few rows to understand structure
    console.log('First 20 rows:');
    for (let i = 0; i < Math.min(20, allData.length); i++) {
      console.log(`Row ${i + 1}:`, allData[i]?.slice(0, 10));
    }
    
    // Find header rows by looking for patterns
    let headerRowIndex = -1;
    let dataStartIndex = -1;
    
    // Look for row containing "No" and "Kegiatan" or similar patterns
    for (let i = 0; i < Math.min(30, allData.length); i++) {
      const row = allData[i];
      if (row && Array.isArray(row)) {
        const rowStr = row.join('|').toLowerCase();
        if (rowStr.includes('no') && (rowStr.includes('kegiatan') || rowStr.includes('aktivitas'))) {
          headerRowIndex = i;
          break;
        }
      }
    }
    
    if (headerRowIndex === -1) {
      // Fallback: assume headers are around row 10-15
      headerRowIndex = 10;
    }
    
    console.log('Header row found at index:', headerRowIndex);
    
    // Look for data start (first row with actual activity data)
    for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 10, allData.length); i++) {
      const row = allData[i];
      if (row && row[1] && String(row[1]).trim() && 
          !String(row[1]).toLowerCase().includes('kode') &&
          !String(row[1]).toLowerCase().includes('no')) {
        dataStartIndex = i;
        break;
      }
    }
    
    if (dataStartIndex === -1) {
      dataStartIndex = headerRowIndex + 3; // Fallback
    }
    
    console.log('Data starts at index:', dataStartIndex);
    
    // Build zone names by combining multiple header rows
    const headerRow1 = allData[headerRowIndex] || [];     // Row with "No", "Kode", "Kegiatan", "Zona Lindung"
    const headerRow2 = allData[headerRowIndex + 1] || []; // Row with zone details
    const headerRow3 = allData[headerRowIndex + 2] || []; // Row with sub-zone details  
    const headerRow4 = allData[headerRowIndex + 3] || []; // Row with zone codes
    
    const zones = [];
    const zoneMapping = {}; // Map column index to zone name
    
    // Start from column 3 (index 3) to skip No, Kode, Kegiatan columns
    for (let i = 3; i < Math.max(headerRow1.length, headerRow2.length, headerRow3.length, headerRow4.length); i++) {
      let zoneName = '';
      
      // Try to get zone name from different header rows
      if (headerRow1[i] && String(headerRow1[i]).trim()) {
        zoneName = String(headerRow1[i]).trim();
      } else if (headerRow2[i] && String(headerRow2[i]).trim()) {
        zoneName = String(headerRow2[i]).trim();
      }
      
      // Add sub-zone info if available
      if (headerRow2[i] && String(headerRow2[i]).trim() && 
          headerRow2[i] !== zoneName && 
          !zoneName.includes(String(headerRow2[i]).trim())) {
        if (zoneName) {
          zoneName += ` - ${String(headerRow2[i]).trim()}`;
        } else {
          zoneName = String(headerRow2[i]).trim();
        }
      }
      
      // Add more specific sub-zone info
      if (headerRow3[i] && String(headerRow3[i]).trim() && 
          !zoneName.includes(String(headerRow3[i]).trim())) {
        if (zoneName) {
          zoneName += ` - ${String(headerRow3[i]).trim()}`;
        } else {
          zoneName = String(headerRow3[i]).trim();
        }
      }
      
      // Clean up zone name
      zoneName = zoneName.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (zoneName && zoneName !== '' && !zones.includes(zoneName)) {
        zones.push(zoneName);
        zoneMapping[i] = zoneName;
      }
    }
    
    console.log('Zones found:', zones.length);
    console.log('Sample zones:', zones.slice(0, 5));
    
    // Process activities starting from dataStartIndex
    const activities = [];
    
    for (let i = dataStartIndex; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length < 3) continue;
      
      // Look for activity name in column 2 (index 1) or column 3 (index 2)
      let activity = '';
      if (row[2] && String(row[2]).trim()) {
        activity = String(row[2]).trim();
      } else if (row[1] && String(row[1]).trim()) {
        activity = String(row[1]).trim();
      }
      
      if (!activity || activity === '' || activity === 'undefined') continue;
      
      // Skip if it looks like a header or section divider
      if (activity.toLowerCase().includes('zona') || 
          activity.toLowerCase().includes('keterangan') ||
          activity.toLowerCase().includes('no.') ||
          activity.length < 3) continue;
      
      const zoneData = {};
      
      // Check each zone column - include ALL values including 'X'
      Object.entries(zoneMapping).forEach(([colIndex, zoneName]) => {
        const cellValue = row[parseInt(colIndex)];
        if (cellValue && String(cellValue).trim() !== '') {
          zoneData[zoneName] = String(cellValue).trim();
        }
      });
      
      // Include ALL activities, even those without zone data or only with 'X' values
      activities.push({
        activity,
        zones: zoneData
      });
    }
    
    console.log('Activities processed:', activities.length);
    
    return {
      activities: activities,
      zones: zones,
      regulations: REGULATION_DEFINITIONS
    };
    
  } catch (error) {
    console.error('Error processing BSB Excel file:', error);
    throw error;
  }
}

// Main execution
const excelPath = path.join(__dirname, '..', 'app', 'data', 'itbx', 'LAMPIRAN XV KETENTUAN KEGIATAN DAN PEMANFAATAN RUANG ZONASI.xlsx');
const outputPath = path.join(__dirname, '..', 'app', 'data', 'bsb-data.json');

// Create data directory if it doesn't exist
const dataDir = path.dirname(outputPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  console.log('🚀 Starting BSB data processing...');
  console.log('Excel file path:', excelPath);
  
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath);
    process.exit(1);
  }
  
  const processedData = processExcelFileBSB(excelPath);
  
  // Save processed data
  fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf-8');
  console.log(`\n💾 Processed data saved to: ${outputPath}`);
  
  console.log('\n✅ BSB Processing completed successfully!');
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
  console.error('❌ Error processing BSB data:', error);
  process.exit(1);
}