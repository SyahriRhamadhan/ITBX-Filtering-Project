import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to parse CSV line with proper comma and quote handling
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

// Function to convert value to appropriate type
function convertValue(value) {
  if (!value || value === '-' || value === '') {
    return null;
  }
  
  // Try to convert to number
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    return numValue;
  }
  
  return value;
}

try {
  console.log('🔄 Memproses file CSV Tata Bangunan...');
  
  // Read the CSV file
  const csvPath = path.join(__dirname, 'app', 'data', 'intensitas', 'Tata_Bangunan___Headers_Fixed__Preview_.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Split into lines and remove empty lines
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('File CSV kosong');
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  console.log('📋 Headers ditemukan:', headers);
  
  // Process data rows
  const tataBangunanData = [];
  const zonaSet = new Set();
  const subZonaSet = new Set();
  const jenisSet = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      console.warn(`⚠️  Baris ${i + 1} memiliki jumlah kolom yang tidak sesuai:`, values);
      continue;
    }
    
    // Create data object
    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = convertValue(values[index]);
    });
    
    // Extract zona from SubZona (format: "Zona Budidaya - SubZona")
    const subZonaFull = rowData['Sub Zona'] || '';
    const zonaParts = subZonaFull.split(' - ');
    const zona = zonaParts[0] || '';
    const subZona = zonaParts.slice(1).join(' - ') || subZonaFull;
    
    // Add zona and clean subzona
    rowData['Zona'] = zona;
    rowData['SubZona'] = subZona;
    
    // Track unique values
    if (zona) zonaSet.add(zona);
    if (subZona) subZonaSet.add(subZona);
    if (rowData['Jenis']) jenisSet.add(rowData['Jenis']);
    
    tataBangunanData.push(rowData);
    
    // Log sample data
    if (i <= 3) {
      console.log(`📄 Contoh baris ${i}:`, rowData);
    }
  }
  
  console.log(`\n📊 Ringkasan data Tata Bangunan:`);
  console.log(`   - Total baris: ${tataBangunanData.length}`);
  console.log(`   - Zona: ${zonaSet.size}`);
  console.log(`   - Sub Zona: ${subZonaSet.size}`);
  console.log(`   - Jenis: ${jenisSet.size}`);
  
  console.log(`\n🏗️  Zona yang tersedia:`, Array.from(zonaSet));
  console.log(`🏘️  Sub Zona yang tersedia:`, Array.from(subZonaSet).slice(0, 10), '...');
  console.log(`🏢 Jenis yang tersedia:`, Array.from(jenisSet));
  
  // Read existing intensitas data
  const intensitasPath = path.join(__dirname, 'app', 'data', 'intensitas-data.json');
  let existingData = { data: [] };
  
  if (fs.existsSync(intensitasPath)) {
    const existingContent = fs.readFileSync(intensitasPath, 'utf-8');
    existingData = JSON.parse(existingContent);
    console.log(`\n📖 Data intensitas yang ada: ${existingData.data.length} baris`);
  }
  
  // Merge data - combine by matching Zona, SubZona, and Jenis
  const mergedData = [];
  const processedKeys = new Set();
  
  // Process existing intensitas data first
  existingData.data.forEach(item => {
    const key = `${item.Zona}|${item.SubZona}|${item.Jenis || ''}`;
    
    // Find matching tata bangunan data
    const tataBangunanMatch = tataBangunanData.find(tb => 
      tb.Zona === item.Zona && 
      tb.SubZona === item.SubZona && 
      (tb.Jenis === item.Jenis || (!tb.Jenis && !item.Jenis))
    );
    
    const mergedItem = {
      ...item,
      // Add tata bangunan fields if match found
      ...(tataBangunanMatch && {
        'Tinggi Bangunan Maks. (m) - Kolektor': tataBangunanMatch['Tinggi Bangunan Maks. (m) - Kolektor'],
        'Tinggi Bangunan Maks. (m) - Lokal': tataBangunanMatch['Tinggi Bangunan Maks. (m) - Lokal'],
        'Lantai Bangunan Maks. - Kolektor': tataBangunanMatch['Lantai Bangunan Maks. - Kolektor'],
        'Lantai Bangunan Maks. - Lokal': tataBangunanMatch['Lantai Bangunan Maks. - Lokal'],
        'Garis Sempadan Bangunan Min. (m) - Kolektor': tataBangunanMatch['Garis Sempadan Bangunan Min. (m) - Kolektor'],
        'Garis Sempadan Bangunan Min. (m) - Lokal': tataBangunanMatch['Garis Sempadan Bangunan Min. (m) - Lokal'],
        'Jarak Bebas Samping Min. (m)': tataBangunanMatch['Jarak Bebas Samping Min. (m)'],
        'Jarak Bebas Belakang Min. (m)': tataBangunanMatch['Jarak Bebas Belakang Min. (m)'],
        'Tampilan Bangunan': tataBangunanMatch['Tampilan Bangunan'],
        'Keterangan': tataBangunanMatch['Keterangan']
      })
    };
    
    mergedData.push(mergedItem);
    processedKeys.add(key);
  });
  
  // Add tata bangunan data that doesn't have intensitas match
  tataBangunanData.forEach(item => {
    const key = `${item.Zona}|${item.SubZona}|${item.Jenis || ''}`;
    
    if (!processedKeys.has(key)) {
      const newItem = {
        Zona: item.Zona,
        SubZona: item.SubZona,
        Jenis: item.Jenis,
        'KDB Maks (%)': null,
        'KDH Min (%)': null,
        'KLB Maks': null,
        'KTB Maks (%)': null,
        'Luas Kavling Min (m2)': null,
        'Tinggi Bangunan Maks. (m) - Kolektor': item['Tinggi Bangunan Maks. (m) - Kolektor'],
        'Tinggi Bangunan Maks. (m) - Lokal': item['Tinggi Bangunan Maks. (m) - Lokal'],
        'Lantai Bangunan Maks. - Kolektor': item['Lantai Bangunan Maks. - Kolektor'],
        'Lantai Bangunan Maks. - Lokal': item['Lantai Bangunan Maks. - Lokal'],
        'Garis Sempadan Bangunan Min. (m) - Kolektor': item['Garis Sempadan Bangunan Min. (m) - Kolektor'],
        'Garis Sempadan Bangunan Min. (m) - Lokal': item['Garis Sempadan Bangunan Min. (m) - Lokal'],
        'Jarak Bebas Samping Min. (m)': item['Jarak Bebas Samping Min. (m)'],
        'Jarak Bebas Belakang Min. (m)': item['Jarak Bebas Belakang Min. (m)'],
        'Tampilan Bangunan': item['Tampilan Bangunan'],
        'Keterangan': item['Keterangan']
      };
      
      mergedData.push(newItem);
    }
  });
  
  // Create updated headers
  const updatedHeaders = [
    'Zona',
    'SubZona', 
    'Jenis',
    'KDB Maks (%)',
    'KDH Min (%)',
    'KLB Maks',
    'KTB Maks (%)',
    'Luas Kavling Min (m2)',
    'Tinggi Bangunan Maks. (m) - Kolektor',
    'Tinggi Bangunan Maks. (m) - Lokal',
    'Lantai Bangunan Maks. - Kolektor',
    'Lantai Bangunan Maks. - Lokal',
    'Garis Sempadan Bangunan Min. (m) - Kolektor',
    'Garis Sempadan Bangunan Min. (m) - Lokal',
    'Jarak Bebas Samping Min. (m)',
    'Jarak Bebas Belakang Min. (m)',
    'Tampilan Bangunan',
    'Keterangan'
  ];
  
  // Create final data structure
  const finalData = {
    data: mergedData,
    summary: {
      totalRows: mergedData.length,
      zonaCount: new Set(mergedData.map(item => item.Zona)).size,
      subZonaCount: new Set(mergedData.map(item => item.SubZona)).size,
      jenisKhususCount: new Set(mergedData.filter(item => item.Jenis).map(item => item.Jenis)).size
    },
    groupedByZona: mergedData.reduce((acc, item) => {
      if (!acc[item.Zona]) {
        acc[item.Zona] = [];
      }
      acc[item.Zona].push(item);
      return acc;
    }, {}),
    filters: {
      zonaList: Array.from(new Set(mergedData.map(item => item.Zona))).sort(),
      subZonaList: Array.from(new Set(mergedData.map(item => item.SubZona))).sort(),
      jenisKhususList: Array.from(new Set(mergedData.filter(item => item.Jenis).map(item => item.Jenis))).sort()
    },
    headers: updatedHeaders
  };
  
  // Save merged data
  const outputPath = path.join(__dirname, 'app', 'data', 'intensitas-data-merged.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
  
  console.log(`\n✅ Data berhasil digabungkan!`);
  console.log(`📁 File disimpan: ${outputPath}`);
  console.log(`📊 Total data gabungan: ${finalData.data.length} baris`);
  console.log(`🏗️  Zona: ${finalData.summary.zonaCount}`);
  console.log(`🏘️  Sub Zona: ${finalData.summary.subZonaCount}`);
  console.log(`🏢 Jenis Khusus: ${finalData.summary.jenisKhususCount}`);
  console.log(`📋 Headers: ${finalData.headers.length} kolom`);
  
  console.log(`\n🔍 Contoh data gabungan:`);
  finalData.data.slice(0, 2).forEach((item, index) => {
    console.log(`   ${index + 1}.`, {
      Zona: item.Zona,
      SubZona: item.SubZona,
      Jenis: item.Jenis,
      'KDB Maks (%)': item['KDB Maks (%)'],
      'Tinggi Bangunan - Kolektor': item['Tinggi Bangunan Maks. (m) - Kolektor'],
      'Garis Sempadan - Kolektor': item['Garis Sempadan Bangunan Min. (m) - Kolektor']
    });
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}