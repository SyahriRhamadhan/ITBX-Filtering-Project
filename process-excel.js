import { processRDTRData } from './app/utils/excelProcessor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Excel file
const excelPath = path.join(__dirname, '..', 'RDTR BUILDER TRIKORA', '3. ITBX LAMPIRAN XIV KETENTUAN KEGIATAN DAN PENGGUNAAN LAHAN (1) - Copy.xlsx');
const outputPath = path.join(__dirname, 'app', 'data', 'rdtr-data.json');

// Create data directory if it doesn't exist
import fs from 'fs';
const dataDir = path.dirname(outputPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  console.log('Starting RDTR data processing...');
  console.log('Excel file path:', excelPath);
  console.log('Output path:', outputPath);
  
  const processedData = processRDTRData(excelPath, outputPath);
  
  console.log('✅ Processing completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Activities: ${processedData.activities.length}`);
  console.log(`   - Zones: ${processedData.zones.length}`);
  console.log(`   - Regulation types: ${Object.keys(processedData.regulations).length}`);
  
} catch (error) {
  console.error('❌ Error processing RDTR data:', error);
  process.exit(1);
}