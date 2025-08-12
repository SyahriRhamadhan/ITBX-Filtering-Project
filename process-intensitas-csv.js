import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function processIntensitasCSV(filePath) {
  try {
    console.log('📊 Processing Intensitas CSV file...');
    
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Parse header
    const headers = parseCSVLine(lines[0]);
    console.log('Headers found:', headers);
    
    // Parse data rows
    const intensitasData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
        continue;
      }
      
      const rowData = {};
      
      headers.forEach((header, index) => {
        let value = values[index];
        
        // Handle empty values
        if (value === '' || value === '-') {
          value = null;
        }
        // Convert numeric values
        else if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        }
        
        rowData[header] = value;
      });
      
      intensitasData.push(rowData);
    }
    
    console.log('Intensitas data processed:', intensitasData.length, 'rows');
    
    // Group by Zona for easier filtering
    const zonaGroups = {};
    const subZonaList = [];
    const jenisKhususList = [];
    
    intensitasData.forEach(item => {
      const zona = item.Zona;
      const subZona = item.SubZona;
      const jenis = item.Jenis;
      
      if (!zonaGroups[zona]) {
        zonaGroups[zona] = [];
      }
      zonaGroups[zona].push(item);
      
      if (subZona && !subZonaList.includes(subZona)) {
        subZonaList.push(subZona);
      }
      
      if (jenis && jenis !== '-' && !jenisKhususList.includes(jenis)) {
        jenisKhususList.push(jenis);
      }
    });
    
    return {
      data: intensitasData,
      summary: {
        totalRows: intensitasData.length,
        zonaCount: Object.keys(zonaGroups).length,
        subZonaCount: subZonaList.length,
        jenisKhususCount: jenisKhususList.length
      },
      groupedByZona: zonaGroups,
      filters: {
        zonaList: Object.keys(zonaGroups).sort(),
        subZonaList: subZonaList.sort(),
        jenisKhususList: jenisKhususList.sort()
      },
      headers: headers
    };
    
  } catch (error) {
    console.error('Error processing Intensitas CSV:', error);
    throw error;
  }
}

// Main execution
const csvPath = path.join(__dirname, 'app', 'data', 'intensitas', 'Tabel_Ketentuan_Intensitas_Pemanfaatan_Ruang.csv');
const outputPath = path.join(__dirname, 'app', 'data', 'intensitas-data.json');

// Create data directory if it doesn't exist
const dataDir = path.dirname(outputPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  console.log('🚀 Starting Intensitas data processing...');
  console.log('CSV file path:', csvPath);
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found at:', csvPath);
    process.exit(1);
  }
  
  const processedData = processIntensitasCSV(csvPath);
  
  // Save processed data
  fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf-8');
  console.log(`\n💾 Processed data saved to: ${outputPath}`);
  
  console.log('\n✅ Intensitas processing completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Total rows: ${processedData.summary.totalRows}`);
  console.log(`   - Zona count: ${processedData.summary.zonaCount}`);
  console.log(`   - SubZona count: ${processedData.summary.subZonaCount}`);
  console.log(`   - Jenis khusus count: ${processedData.summary.jenisKhususCount}`);
  
  console.log('\n🏢 Available Zona:');
  processedData.filters.zonaList.forEach((zona, index) => {
    const count = processedData.groupedByZona[zona].length;
    console.log(`   ${index + 1}. ${zona} (${count} items)`);
  });
  
  console.log('\n📋 Sample data:');
  processedData.data.slice(0, 5).forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.Zona} - ${item.SubZona}`);
    console.log(`      KDB: ${item['KDB Maks (%)']}%, KDH: ${item['KDH Min (%)']}%, KLB: ${item['KLB Maks']}`);
  });
  
} catch (error) {
  console.error('❌ Error processing Intensitas data:', error);
  process.exit(1);
}