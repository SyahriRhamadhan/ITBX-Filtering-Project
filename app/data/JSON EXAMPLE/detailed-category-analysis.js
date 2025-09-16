import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the JSON file
const jsonFilePath = path.join(__dirname, 'app', 'data', 'JSON EXAMPLE', 'json_WP Bandar Seri Bentan.json');

console.log('🔍 DETAILED CATEGORY ANALYSIS - WP Bandar Seri Bentan\n');

try {
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Collect all categories found
    const allCategories = new Set();
    jsonData.forEach(item => {
        Object.values(item).forEach(zone => {
            Object.keys(zone).forEach(category => {
                allCategories.add(category);
            });
        });
    });
    
    console.log('📋 CATEGORIES FOUND:', Array.from(allCategories).sort());
    console.log('');
    
    // Analyze each category in detail
    Array.from(allCategories).sort().forEach(categoryName => {
        console.log(`\n🏷️  CATEGORY: ${categoryName.toUpperCase()}`);
        console.log('=' .repeat(50));
        
        let totalItems = 0;
        let zonesWithData = 0;
        let sampleRules = new Set();
        let keyPatterns = new Set();
        let ruleTypeCount = {};
        
        jsonData.forEach(item => {
            Object.entries(item).forEach(([zoneKey, zone]) => {
                if (zone[categoryName] && zone[categoryName].data) {
                    const data = zone[categoryName].data;
                    if (data.length > 0) {
                        zonesWithData++;
                        totalItems += data.length;
                        
                        // Analyze first few items for patterns
                        data.slice(0, 5).forEach(dataItem => {
                            Object.entries(dataItem).forEach(([key, rules]) => {
                                keyPatterns.add(key);
                                if (Array.isArray(rules)) {
                                    rules.forEach(rule => {
                                        const ruleType = rule.split(' ')[0];
                                        ruleTypeCount[ruleType] = (ruleTypeCount[ruleType] || 0) + 1;
                                        if (sampleRules.size < 10) {
                                            sampleRules.add(rule);
                                        }
                                    });
                                }
                            });
                        });
                    }
                }
            });
        });
        
        console.log(`📊 Statistics:`);
        console.log(`   - Total data items: ${totalItems}`);
        console.log(`   - Zones with data: ${zonesWithData}`);
        console.log(`   - Unique key patterns: ${keyPatterns.size}`);
        
        if (keyPatterns.size > 0) {
            const sortedKeys = Array.from(keyPatterns).sort();
            console.log(`   - Key range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
            console.log(`   - Sample keys: ${sortedKeys.slice(0, 10).join(', ')}`);
        }
        
        console.log(`\n📋 Rule Types Distribution:`);
        Object.entries(ruleTypeCount)
            .sort(([,a], [,b]) => b - a)
            .forEach(([type, count]) => {
                console.log(`   - ${type}: ${count} occurrences`);
            });
        
        console.log(`\n📝 Sample Rules:`);
        Array.from(sampleRules).slice(0, 5).forEach((rule, index) => {
            console.log(`   ${index + 1}. ${rule.substring(0, 100)}${rule.length > 100 ? '...' : ''}`);
        });
    });
    
    // Zone analysis
    console.log('\n\n🗺️  ZONE ANALYSIS');
    console.log('=' .repeat(50));
    
    const zoneStats = {};
    jsonData.forEach(item => {
        Object.entries(item).forEach(([zoneKey, zone]) => {
            if (!zoneStats[zoneKey]) {
                zoneStats[zoneKey] = {
                    categories: new Set(),
                    totalItems: 0
                };
            }
            
            Object.entries(zone).forEach(([categoryName, categoryData]) => {
                zoneStats[zoneKey].categories.add(categoryName);
                if (categoryData.data) {
                    zoneStats[zoneKey].totalItems += categoryData.data.length;
                }
            });
        });
    });
    
    console.log(`📊 Zone Statistics:`);
    console.log(`   - Total unique zones: ${Object.keys(zoneStats).length}`);
    
    // Show top zones by data volume
    const topZones = Object.entries(zoneStats)
        .sort(([,a], [,b]) => b.totalItems - a.totalItems)
        .slice(0, 10);
    
    console.log(`\n🏆 Top 10 Zones by Data Volume:`);
    topZones.forEach(([zoneKey, stats], index) => {
        console.log(`   ${index + 1}. ${zoneKey}: ${stats.totalItems} items, ${stats.categories.size} categories`);
    });
    
    // Zone pattern analysis
    console.log(`\n🔍 Zone Pattern Analysis:`);
    const zonePatterns = {};
    Object.keys(zoneStats).forEach(zoneKey => {
        const pattern = zoneKey.split('.')[0]; // Get the prefix before first dot
        zonePatterns[pattern] = (zonePatterns[pattern] || 0) + 1;
    });
    
    Object.entries(zonePatterns)
        .sort(([,a], [,b]) => b - a)
        .forEach(([pattern, count]) => {
            console.log(`   - ${pattern}: ${count} zones`);
        });
    
    console.log('\n✅ Detailed analysis complete!');
    
} catch (error) {
    console.error('❌ Error analyzing JSON file:', error.message);
}