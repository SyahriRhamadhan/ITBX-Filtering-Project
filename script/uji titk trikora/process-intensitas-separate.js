import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Function to convert CSV to JSON
function csvToJson(csvFilePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Function to clean and normalize data
function cleanData(data) {
  return data.map(row => {
    const cleanedRow = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.trim();
      let value = row[key];
      
      // Convert '-' to null
      if (value === '-' || value === '' || value === undefined) {
        value = null;
      }
      // Convert numeric strings to numbers
      else if (!isNaN(value) && value !== '') {
        value = parseFloat(value);
      }
      
      cleanedRow[cleanKey] = value;
    });
    return cleanedRow;
  });
}

// Function to merge intensitas and tata bangunan data
function mergeData(intensitasData, tataBangunanData) {
  const merged = [];
  
  intensitasData.forEach(intensitasRow => {
    // Find matching tata bangunan row
    const matchingTataRow = tataBangunanData.find(tataRow => {
      const tataSubZona = tataRow['Sub Zona'] || '';
      const tataJenis = tataRow['Jenis'] || null;
      
      // Extract zona and subzona from tata bangunan format (e.g., "Zona Budidaya - Pariwisata")
      const tataZonaParts = tataSubZona.split(' - ');
      const tataZona = tataZonaParts[0] || '';
      const tataSubZonaName = tataZonaParts[1] || '';
      
      return intensitasRow.Zona === tataZona && 
             intensitasRow['Sub Zona'] === tataSubZonaName &&
             intensitasRow.Jenis === tataJenis;
    });
    
    // Create merged row
    const mergedRow = {
      'Zona': intensitasRow.Zona,
      'SubZona': intensitasRow['Sub Zona'],
      'Jenis': intensitasRow.Jenis,
      'KDB Maks (%)': intensitasRow['KDB Maks. (%)'],
      'KDH Min (%)': intensitasRow['KDH Min. (%)'],
      'KLB Maks': intensitasRow['KLB Maks.'],
      'KTB Maks (%)': intensitasRow['KTB Maks. (%)'],
      'Luas Kavling Min (m2)': intensitasRow['Luas Kavling Min. (m2)']
    };
    
    // Add tata bangunan data if found
    if (matchingTataRow) {
      mergedRow['Tinggi Bangunan Maks. (m) - Kolektor'] = matchingTataRow['Tinggi Bangunan Maks. (m) - Kolektor'];
      mergedRow['Tinggi Bangunan Maks. (m) - Lokal'] = matchingTataRow['Tinggi Bangunan Maks. (m) - Lokal'];
      mergedRow['Lantai Bangunan Maks. - Kolektor'] = matchingTataRow['Lantai Bangunan Maks. - Kolektor'];
      mergedRow['Lantai Bangunan Maks. - Lokal'] = matchingTataRow['Lantai Bangunan Maks. - Lokal'];
      mergedRow['Garis Sempadan Bangunan Min. (m) - Kolektor'] = matchingTataRow['Garis Sempadan Bangunan Min. (m) - Kolektor'];
      mergedRow['Garis Sempadan Bangunan Min. (m) - Lokal'] = matchingTataRow['Garis Sempadan Bangunan Min. (m) - Lokal'];
      mergedRow['Jarak Bebas Samping Min. (m)'] = matchingTataRow['Jarak Bebas Samping Min. (m)'];
      mergedRow['Jarak Bebas Belakang Min. (m)'] = matchingTataRow['Jarak Bebas Belakang Min. (m)'];
      mergedRow['Tampilan Bangunan'] = matchingTataRow['Tampilan Bangunan'];
      mergedRow['Keterangan'] = matchingTataRow['Keterangan'];
    } else {
      // Add null values for missing tata bangunan data
      mergedRow['Tinggi Bangunan Maks. (m) - Kolektor'] = null;
      mergedRow['Tinggi Bangunan Maks. (m) - Lokal'] = null;
      mergedRow['Lantai Bangunan Maks. - Kolektor'] = null;
      mergedRow['Lantai Bangunan Maks. - Lokal'] = null;
      mergedRow['Garis Sempadan Bangunan Min. (m) - Kolektor'] = null;
      mergedRow['Garis Sempadan Bangunan Min. (m) - Lokal'] = null;
      mergedRow['Jarak Bebas Samping Min. (m)'] = null;
      mergedRow['Jarak Bebas Belakang Min. (m)'] = null;
      mergedRow['Tampilan Bangunan'] = null;
      mergedRow['Keterangan'] = null;
    }
    
    merged.push(mergedRow);
  });
  
  return merged;
}

// Function to generate summary and filters
function generateSummaryAndFilters(data) {
  const zonaSet = new Set();
  const subZonaSet = new Set();
  const jenisKhususSet = new Set();
  const groupedByZona = {};
  
  data.forEach(row => {
    if (row.Zona) zonaSet.add(row.Zona);
    if (row.SubZona) subZonaSet.add(row.SubZona);
    if (row.Jenis) jenisKhususSet.add(row.Jenis);
    
    // Group by zona
    if (!groupedByZona[row.Zona]) {
      groupedByZona[row.Zona] = [];
    }
    groupedByZona[row.Zona].push(row);
  });
  
  const headers = Object.keys(data[0] || {});
  
  return {
    summary: {
      totalRows: data.length,
      zonaCount: zonaSet.size,
      subZonaCount: subZonaSet.size,
      jenisKhususCount: jenisKhususSet.size
    },
    groupedByZona,
    filters: {
      zonaList: Array.from(zonaSet).sort(),
      subZonaList: Array.from(subZonaSet).sort(),
      jenisKhususList: Array.from(jenisKhususSet).sort()
    },
    headers
  };
}

async function main() {
  try {
    console.log('Processing Trikora intensitas data...');
    
    // Read CSV files
    const intensitasData = await csvToJson('app/data/intensitas/Intensitas_v4___Preview (1).csv');
    const tataBangunanData = await csvToJson('app/data/intensitas/Tata_Bangunan___Arteri_Kolektor_Lokal__Preview_.csv');
    
    // Clean data
    const cleanedIntensitasData = cleanData(intensitasData);
    const cleanedTataBangunanData = cleanData(tataBangunanData);
    
    // Create basic intensitas data (Trikora)
    const trikoraData = cleanedIntensitasData.map(row => ({
      'Zona': row.Zona,
      'SubZona': row['Sub Zona'],
      'Jenis': row.Jenis,
      'KDB Maks (%)': row['KDB Maks. (%)'],
      'KDH Min (%)': row['KDH Min. (%)'],
      'KLB Maks': row['KLB Maks.'],
      'KTB Maks (%)': row['KTB Maks. (%)'],
      'Luas Kavling Min (m2)': row['Luas Kavling Min. (m2)']
    }));
    
    // Create merged data (Trikora with Tata Bangunan)
    const trikoraMergedData = mergeData(cleanedIntensitasData, cleanedTataBangunanData);
    
    // Generate summary and filters for both datasets
    const trikoraSummary = generateSummaryAndFilters(trikoraData);
    const trikoraMergedSummary = generateSummaryAndFilters(trikoraMergedData);
    
    // Create final JSON structures
    const trikoraJson = {
      data: trikoraData,
      ...trikoraSummary
    };
    
    const trikoraMergedJson = {
      data: trikoraMergedData,
      ...trikoraMergedSummary
    };
    
    // Write Trikora files
    fs.writeFileSync('app/data/intensitas-data-trikora.json', JSON.stringify(trikoraJson, null, 2));
    fs.writeFileSync('app/data/intensitas-data-merged-trikora.json', JSON.stringify(trikoraMergedJson, null, 2));
    
    console.log('✅ Trikora intensitas data files created successfully!');
    console.log(`- intensitas-data-trikora.json: ${trikoraData.length} rows`);
    console.log(`- intensitas-data-merged-trikora.json: ${trikoraMergedData.length} rows`);
    
    // For BSB, we'll create placeholder files with similar structure but different data
    // This is a template - you would need actual BSB CSV data to populate these
    const bsbData = trikoraData.map(row => ({
      ...row,
      // Add BSB-specific modifications here if needed
    }));
    
    const bsbMergedData = trikoraMergedData.map(row => ({
      ...row,
      // Add BSB-specific modifications here if needed
    }));
    
    const bsbSummary = generateSummaryAndFilters(bsbData);
    const bsbMergedSummary = generateSummaryAndFilters(bsbMergedData);
    
    const bsbJson = {
      data: bsbData,
      ...bsbSummary
    };
    
    const bsbMergedJson = {
      data: bsbMergedData,
      ...bsbMergedSummary
    };
    
    // Write BSB files (currently same as Trikora - replace with actual BSB data when available)
    fs.writeFileSync('app/data/intensitas-data-bsb.json', JSON.stringify(bsbJson, null, 2));
    fs.writeFileSync('app/data/intensitas-data-merged-bsb.json', JSON.stringify(bsbMergedJson, null, 2));
    
    console.log('✅ BSB intensitas data files created successfully!');
    console.log(`- intensitas-data-bsb.json: ${bsbData.length} rows`);
    console.log(`- intensitas-data-merged-bsb.json: ${bsbMergedData.length} rows`);
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
  }
}

main();