import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

interface ActivityData {
  activity: string;
  zones: { [zoneName: string]: string };
}

interface ProcessedData {
  activities: ActivityData[];
  zones: string[];
  regulations: { [code: string]: string };
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

export function processExcelFile(filePath: string): ProcessedData {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet (ITBX TRIKORA)
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row 7 (0-indexed as 6)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      range: 7 // Start from row 8 (0-indexed as 7)
    }) as any[][];
    
    if (jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }
    
    // Get headers (zone names) from the first row
    const headers = jsonData[0] as string[];
    const zones = headers.slice(3).filter(zone => zone && zone.trim() !== ''); // Skip first 3 columns, filter empty
    
    // Process activities data
    const activities: ActivityData[] = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0]) continue; // Skip empty rows
      
      const activity = String(row[0]).trim();
      if (!activity || activity === '') continue;
      
      const zoneData: { [zoneName: string]: string } = {};
      
      // Map each zone to its regulation code
      zones.forEach((zone, zoneIndex) => {
        const cellValue = row[zoneIndex + 3]; // Offset by 3 for the first 3 columns
        if (cellValue && cellValue !== 'X' && cellValue.trim() !== '') {
          zoneData[zone] = String(cellValue).trim();
        }
      });
      
      activities.push({
        activity,
        zones: zoneData
      });
    }
    
    return {
      activities: activities.filter(act => Object.keys(act.zones).length > 0), // Only include activities with zone data
      zones: zones.filter(zone => zone && zone.trim() !== ''),
      regulations: REGULATION_DEFINITIONS
    };
    
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw error;
  }
}

// Function to save processed data as JSON
export function saveProcessedData(data: ProcessedData, outputPath: string): void {
  try {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Processed data saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error saving processed data:', error);
    throw error;
  }
}

// Main processing function
export function processRDTRData(excelPath: string, outputPath: string): ProcessedData {
  console.log('Processing RDTR Excel file...');
  const processedData = processExcelFile(excelPath);
  
  console.log(`Found ${processedData.activities.length} activities`);
  console.log(`Found ${processedData.zones.length} zones`);
  
  saveProcessedData(processedData, outputPath);
  
  return processedData;
}