import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the JSON file
const jsonFilePath = path.join(__dirname, 'app', 'data', 'JSON EXAMPLE', 'json_WP Bandar Seri Bentan.json');

console.log('🔍 Analyzing JSON structure for WP Bandar Seri Bentan...\n');

try {
    // Read and parse the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    console.log('📊 BASIC STRUCTURE ANALYSIS:');
    console.log('- File type:', Array.isArray(jsonData) ? 'Array' : 'Object');
    console.log('- Root level items:', jsonData.length);
    
    // Analyze the first item structure
    const firstItem = jsonData[0];
    const zoneKeys = Object.keys(firstItem);
    
    console.log('\n🏗️ ZONE STRUCTURE:');
    console.log('- Number of zones in first item:', zoneKeys.length);
    console.log('- Zone keys:', zoneKeys);
    
    // Analyze each zone's structure
    zoneKeys.forEach(zoneKey => {
        const zone = firstItem[zoneKey];
        console.log(`\n📍 Zone: ${zoneKey}`);
        console.log('  Categories:', Object.keys(zone));
        
        // Analyze each category
        Object.keys(zone).forEach(category => {
            const categoryData = zone[category];
            console.log(`  - ${category}:`);
            console.log(`    - Has data array: ${Array.isArray(categoryData.data)}`);
            console.log(`    - Data items count: ${categoryData.data.length}`);
            
            if (categoryData.data.length > 0) {
                const firstDataItem = categoryData.data[0];
                const dataKeys = Object.keys(firstDataItem);
                console.log(`    - First data item keys: ${dataKeys}`);
                
                // Sample the first few data items to understand patterns
                const sampleSize = Math.min(3, categoryData.data.length);
                console.log(`    - Sample data (first ${sampleSize} items):`);
                
                for (let i = 0; i < sampleSize; i++) {
                    const item = categoryData.data[i];
                    const itemKey = Object.keys(item)[0];
                    const itemValue = item[itemKey];
                    console.log(`      ${itemKey}: ${Array.isArray(itemValue) ? `[${itemValue.length} rules]` : itemValue}`);
                    
                    if (Array.isArray(itemValue) && itemValue.length > 0) {
                        console.log(`        Sample rule: "${itemValue[0].substring(0, 80)}..."`);
                    }
                }
            }
        });
    });
    
    // Analyze patterns across all zones
    console.log('\n🔍 PATTERN ANALYSIS:');
    
    // Count unique zone patterns
    const zonePatterns = new Set();
    const categoryStats = {
        iznktg: { totalItems: 0, nonEmptyZones: 0 },
        tbtktg: { totalItems: 0, nonEmptyZones: 0 },
        bstktg: { totalItems: 0, nonEmptyZones: 0 }
    };
    
    jsonData.forEach(item => {
        Object.keys(item).forEach(zoneKey => {
            zonePatterns.add(zoneKey);
            const zone = item[zoneKey];
            
            Object.keys(categoryStats).forEach(category => {
                if (zone[category] && zone[category].data) {
                    const dataLength = zone[category].data.length;
                    categoryStats[category].totalItems += dataLength;
                    if (dataLength > 0) {
                        categoryStats[category].nonEmptyZones++;
                    }
                }
            });
        });
    });
    
    console.log('- Unique zone patterns found:', zonePatterns.size);
    console.log('- Zone pattern examples:', Array.from(zonePatterns).slice(0, 5));
    
    console.log('\n📈 CATEGORY STATISTICS:');
    Object.keys(categoryStats).forEach(category => {
        const stats = categoryStats[category];
        console.log(`- ${category.toUpperCase()}:`);
        console.log(`  - Total data items: ${stats.totalItems}`);
        console.log(`  - Zones with data: ${stats.nonEmptyZones}`);
    });
    
    // Analyze rule types
    console.log('\n📋 RULE TYPE ANALYSIS:');
    const ruleTypes = new Set();
    const rulePatterns = {};
    
    jsonData.forEach(item => {
        Object.keys(item).forEach(zoneKey => {
            const zone = item[zoneKey];
            ['iznktg', 'tbtktg', 'bstktg'].forEach(category => {
                if (zone[category] && zone[category].data) {
                    zone[category].data.forEach(dataItem => {
                        Object.values(dataItem).forEach(rules => {
                            if (Array.isArray(rules)) {
                                rules.forEach(rule => {
                                    const rulePrefix = rule.split(' ')[0];
                                    ruleTypes.add(rulePrefix);
                                    rulePatterns[rulePrefix] = (rulePatterns[rulePrefix] || 0) + 1;
                                });
                            }
                        });
                    });
                }
            });
        });
    });
    
    console.log('- Rule prefixes found:', Array.from(ruleTypes).sort());
    console.log('- Most common rule types:');
    Object.entries(rulePatterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([prefix, count]) => {
            console.log(`  ${prefix}: ${count} occurrences`);
        });
    
    console.log('\n✅ Analysis complete!');
    
} catch (error) {
    console.error('❌ Error analyzing JSON file:', error.message);
    console.error('Stack trace:', error.stack);
}