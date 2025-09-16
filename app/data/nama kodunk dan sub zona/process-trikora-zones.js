import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Trikora Excel file
const excelFilePath = path.join(__dirname, 'trikora.xlsx');
const outputFilePath = path.join(__dirname, 'trikora-zones-clean.json');

console.log('🔄 Processing Trikora Zones Excel File...\n');

try {
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    // Get the first sheet (assuming data is in the first sheet)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📋 Processing sheet: "${sheetName}"`);
    
    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    console.log(`📊 Total rows: ${data.length}`);
    
    // Find header row (look for rows containing zone-related keywords)
    let headerRowIndex = -1;
    let nameColumnIndex = -1;
    let kodunkColumnIndex = -1;
    
    for (let i = 0; i < Math.min(20, data.length); i++) {
        const row = data[i];
        if (row && row.length > 0) {
            const rowStr = row.join('|').toLowerCase();
            if (rowStr.includes('zona') || rowStr.includes('kodungk') || rowStr.includes('sub') || rowStr.includes('kode') || rowStr.includes('nama')) {
                headerRowIndex = i;
                console.log(`🏷️  Found header at row ${i + 1}: ${JSON.stringify(row)}`);
                
                // Find column indices
                row.forEach((header, colIndex) => {
                    const headerStr = String(header).toLowerCase();
                    if (headerStr.includes('nama') || headerStr.includes('zona') || headerStr.includes('sub')) {
                        nameColumnIndex = colIndex;
                    }
                    if (headerStr.includes('kodungk') || headerStr.includes('kode')) {
                        kodunkColumnIndex = colIndex;
                    }
                });
                break;
            }
        }
    }
    
    // If no clear header found, assume first row is header or data starts from row 1
    if (headerRowIndex === -1) {
        console.log('⚠️  No clear header found, assuming data starts from row 1');
        headerRowIndex = 0;
        nameColumnIndex = 0;
        kodunkColumnIndex = 1;
    }
    
    console.log(`📍 Using columns - Name: ${nameColumnIndex + 1}, Kodunk: ${kodunkColumnIndex + 1}`);
    
    // Process data starting from after header
    const processedZones = new Map();
    const zoneGroups = {};
    let duplicatesRemoved = 0;
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        const name = row[nameColumnIndex];
        const kodunk = row[kodunkColumnIndex];
        
        // Skip empty rows
        if (!name && !kodunk) continue;
        if (name === '' && kodunk === '') continue;
        
        // Clean and validate data
        const cleanName = String(name || '').trim();
        const cleanKodunk = String(kodunk || '').trim();
        
        if (!cleanName || !cleanKodunk) continue;
        
        // Create zone object
        const zoneKey = `${cleanName}_${cleanKodunk}`;
        
        if (processedZones.has(zoneKey)) {
            duplicatesRemoved++;
            continue;
        }
        
        const zone = {
            name: cleanName,
            kodunk: cleanKodunk,
            originalRow: i + 1
        };
        
        processedZones.set(zoneKey, zone);
        
        // Group by kodunk prefix (first few characters)
        let groupKey = cleanKodunk;
        
        // Try to find a meaningful group pattern
        if (cleanKodunk.includes('-')) {
            groupKey = cleanKodunk.split('-')[0];
        } else if (cleanKodunk.includes('.')) {
            groupKey = cleanKodunk.split('.')[0];
        } else if (cleanKodunk.length > 3) {
            // Group by first 2-3 characters for longer codes
            groupKey = cleanKodunk.substring(0, Math.min(3, cleanKodunk.length));
        }
        
        if (!zoneGroups[groupKey]) {
            zoneGroups[groupKey] = [];
        }
        
        zoneGroups[groupKey].push(zone);
    }
    
    // Convert to arrays and sort
    const allZones = Array.from(processedZones.values()).sort((a, b) => {
        if (a.kodunk !== b.kodunk) {
            return a.kodunk.localeCompare(b.kodunk);
        }
        return a.name.localeCompare(b.name);
    });
    
    // Sort zone groups
    Object.keys(zoneGroups).forEach(groupKey => {
        zoneGroups[groupKey].sort((a, b) => {
            if (a.kodunk !== b.kodunk) {
                return a.kodunk.localeCompare(b.kodunk);
            }
            return a.name.localeCompare(b.name);
        });
    });
    
    // Create output structure
    const output = {
        metadata: {
            sourceFile: 'trikora.xlsx',
            processedAt: new Date().toISOString(),
            totalZones: allZones.length,
            duplicatesRemoved: duplicatesRemoved,
            zoneGroups: Object.keys(zoneGroups).length
        },
        zoneGroups: zoneGroups,
        allZones: allZones
    };
    
    // Save to file
    fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2), 'utf8');
    
    // Display summary
    console.log('\n📈 PROCESSING SUMMARY:');
    console.log(`✅ Total unique zones: ${allZones.length}`);
    console.log(`🗂️  Zone groups: ${Object.keys(zoneGroups).length}`);
    console.log(`🔄 Duplicates removed: ${duplicatesRemoved}`);
    console.log(`💾 Output saved to: ${path.basename(outputFilePath)}`);
    
    // Show sample zones
    console.log('\n📋 SAMPLE ZONES:');
    allZones.slice(0, 10).forEach((zone, index) => {
        console.log(`${index + 1}. ${zone.name} (${zone.kodunk})`);
    });
    
    // Show zone groups summary
    console.log('\n🗂️  ZONE GROUPS SUMMARY:');
    Object.entries(zoneGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 10)
        .forEach(([groupKey, zones]) => {
            console.log(`${groupKey}: ${zones.length} zones`);
            if (zones.length <= 3) {
                zones.forEach(zone => {
                    console.log(`  - ${zone.name} (${zone.kodunk})`);
                });
            } else {
                console.log(`  - ${zones[0].name} (${zones[0].kodunk})`);
                console.log(`  - ${zones[1].name} (${zones[1].kodunk})`);
                console.log(`  - ... and ${zones.length - 2} more`);
            }
        });
    
    console.log('\n✅ Processing complete!');
    
} catch (error) {
    console.error('❌ Error processing Excel file:', error.message);
    console.error('Stack trace:', error.stack);
}