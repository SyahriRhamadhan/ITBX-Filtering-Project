import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the BSB data file
const dataPath = path.join(__dirname, 'app', 'data', 'bsb-data.json');

try {
  console.log('=== ANALISIS DATA BSB ===');
  
  // Read the raw file content
  const rawContent = fs.readFileSync(dataPath, 'utf-8');
  
  // Count occurrences of "activity": in raw text
  const activityMatches = rawContent.match(/"activity":/g);
  const rawActivityCount = activityMatches ? activityMatches.length : 0;
  
  // Parse JSON and analyze
  const data = JSON.parse(rawContent);
  const activitiesCount = data.activities ? data.activities.length : 0;
  const zonesCount = data.zones ? data.zones.length : 0;
  const regulationsCount = data.regulations ? Object.keys(data.regulations).length : 0;
  
  // Check for duplicates
  const activityNames = data.activities ? data.activities.map(a => a.activity) : [];
  const uniqueActivities = [...new Set(activityNames)];
  const duplicates = activitiesCount - uniqueActivities.length;
  
  console.log(`Jumlah "activity": dalam teks mentah: ${rawActivityCount}`);
  console.log(`Jumlah aktivitas dalam JSON parsed: ${activitiesCount}`);
  console.log(`Jumlah aktivitas unik: ${uniqueActivities.length}`);
  console.log(`Jumlah duplikasi: ${duplicates}`);
  
  console.log('\n=== STATISTIK LAINNYA ===');
  console.log(`Jumlah zona: ${zonesCount}`);
  console.log(`Jumlah regulasi: ${regulationsCount}`);
  
  // Check for invalid activities
  const invalidActivities = data.activities ? data.activities.filter(a => 
    !a.activity || a.activity.trim() === '' || a.activity === 'undefined'
  ) : [];
  
  if (invalidActivities.length > 0) {
    console.log(`\n⚠️  Aktivitas tidak valid ditemukan: ${invalidActivities.length}`);
  }
  
  // Analyze raw file structure
  const lines = rawContent.split('\n');
  const activityLines = [];
  
  lines.forEach((line, index) => {
    if (line.includes('"activity":')) {
      activityLines.push(index + 1); // 1-indexed
    }
  });
  
  console.log('\n=== ANALISIS BARIS ===');
  console.log(`Total baris dalam file: ${lines.length}`);
  console.log(`Baris yang mengandung "activity": ${activityLines.length}`);
  if (activityLines.length > 0) {
    console.log(`Baris pertama dengan "activity": ${activityLines[0]}`);
    console.log(`Baris terakhir dengan "activity": ${activityLines[activityLines.length - 1]}`);
  }
  
  // Sample zones analysis
  if (data.zones && data.zones.length > 0) {
    console.log('\n=== CONTOH ZONA ===');
    data.zones.slice(0, 10).forEach((zone, index) => {
      console.log(`${index + 1}. ${zone}`);
    });
  }
  
  // Sample activities with zone count
  if (data.activities && data.activities.length > 0) {
    console.log('\n=== CONTOH AKTIVITAS ===');
    data.activities.slice(0, 5).forEach((activity, index) => {
      const zoneCount = Object.keys(activity.zones || {}).length;
      console.log(`${index + 1}. ${activity.activity} (${zoneCount} zona)`);
    });
  }
  
} catch (error) {
  console.error('Error analyzing BSB data:', error);
  process.exit(1);
}