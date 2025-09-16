import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the BSB Excel file
const excelFilePath = path.join(__dirname, 'bsb.xlsx');
const outputFilePath = path.join(__dirname, '..', '..', '..', 'app', 'data', 'bsb-zones-clean.json');

console.log('🔄 Processing BSB Zones Excel File...\n');

try {
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    console.log(`📊 Raw data: ${data.length} rows`);
    
    // Process the data
    const zones = new Map(); // Using Map to avoid duplicates
    const duplicates = [];
    
    // Skip header row (row 0) and process data
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row && row.length >= 2) {
            let zoneName = String(row[0]).trim();
            let zoneCode = String(row[1]).trim().replace(/\r/g, ''); // Remove carriage returns
            
            // Skip empty rows
            if (!zoneName || !zoneCode) continue;
            
            // Check if this combination already exists
            const key = `${zoneName}|${zoneCode}`;
            
            if (zones.has(zoneCode)) {
                const existing = zones.get(zoneCode);
                if (existing.name !== zoneName) {
                    duplicates.push({
                        row: i + 1,
                        existing: existing,
                        duplicate: { name: zoneName, code: zoneCode }
                    });
                }
            } else {
                zones.set(zoneCode, {
                    name: zoneName,
                    code: zoneCode
                });
            }
        }
    }
    
    console.log(`\n📈 Processing Results:`);
    console.log(`- Unique zones found: ${zones.size}`);
    console.log(`- Duplicates detected: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
        console.log(`\n⚠️  Duplicate Analysis:`);
        duplicates.forEach((dup, index) => {
            console.log(`${index + 1}. Row ${dup.row}: "${dup.duplicate.name}" vs existing "${dup.existing.name}" for code "${dup.duplicate.code}"`);
        });
    }
    
    // Convert Map to array and sort by zone code
    const uniqueZones = Array.from(zones.values()).sort((a, b) => a.code.localeCompare(b.code));
    
    console.log(`\n🏷️  Unique Zone Summary:`);
    const zoneGroups = {};
    uniqueZones.forEach(zone => {
        const prefix = zone.code.split('.')[0];
        if (!zoneGroups[prefix]) {
            zoneGroups[prefix] = [];
        }
        zoneGroups[prefix].push(zone);
    });
    
    Object.entries(zoneGroups).forEach(([prefix, zones]) => {
        console.log(`- ${prefix}: ${zones.length} zones`);
        zones.slice(0, 3).forEach(zone => {
            console.log(`  • ${zone.name} (${zone.code})`);
        });
        if (zones.length > 3) {
            console.log(`  ... and ${zones.length - 3} more`);
        }
    });
    
    // Create the final JSON structure
    const result = {
        metadata: {
            source: "BSB Zones Excel File",
            processedAt: new Date().toISOString(),
            totalZones: uniqueZones.length,
            duplicatesRemoved: duplicates.length,
            zoneGroups: Object.keys(zoneGroups).length
        },
        zoneGroups: zoneGroups,
        zones: uniqueZones.map(zone => ({
            id: zone.code,
            name: zone.name,
            code: zone.code,
            prefix: zone.code.split('.')[0],
            hierarchy: zone.code.split('.').map((part, index) => ({
                level: index,
                value: part
            }))
        }))
    };
    
    // Write to JSON file
    fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2), 'utf8');
    
    console.log(`\n✅ Processing Complete!`);
    console.log(`📁 Output saved to: ${path.relative(process.cwd(), outputFilePath)}`);
    console.log(`📊 Final structure:`);
    console.log(`   - Total unique zones: ${result.zones.length}`);
    console.log(`   - Zone groups: ${Object.keys(result.zoneGroups).join(', ')}`);
    console.log(`   - Duplicates removed: ${result.metadata.duplicatesRemoved}`);
    
    // Show sample of the final data
    console.log(`\n📝 Sample zones:`);
    result.zones.slice(0, 10).forEach((zone, index) => {
        console.log(`${index + 1}. ${zone.name} → ${zone.code}`);
    });
    
} catch (error) {
    console.error('❌ Error processing Excel file:', error.message);
    console.error('Stack trace:', error.stack);
}