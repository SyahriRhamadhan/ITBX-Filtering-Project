import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON file
const dataPath = path.join(__dirname, 'app', 'data', 'rdtr-data.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');

// Count occurrences of "activity": in raw text
const activityMatches = rawData.match(/"activity":/g);
const rawCount = activityMatches ? activityMatches.length : 0;

// Parse JSON and count activities
let jsonData;
let jsonCount = 0;
let uniqueActivities = new Set();
let duplicates = [];

try {
  jsonData = JSON.parse(rawData);
  jsonCount = jsonData.activities ? jsonData.activities.length : 0;
  
  // Check for duplicates
  const activityNames = jsonData.activities.map(a => a.activity);
  activityNames.forEach((name, index) => {
    if (uniqueActivities.has(name)) {
      duplicates.push({ name, index });
    } else {
      uniqueActivities.add(name);
    }
  });
  
} catch (error) {
  console.error('Error parsing JSON:', error);
}

console.log('=== ANALISIS DATA RDTR ===');
console.log(`Jumlah "activity": dalam teks mentah: ${rawCount}`);
console.log(`Jumlah aktivitas dalam JSON parsed: ${jsonCount}`);
console.log(`Jumlah aktivitas unik: ${uniqueActivities.size}`);
console.log(`Jumlah duplikasi: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log('\n=== DUPLIKASI DITEMUKAN ===');
  duplicates.forEach(dup => {
    console.log(`- "${dup.name}" (index: ${dup.index})`);
  });
}

// Check if there are any null or undefined activities
if (jsonData && jsonData.activities) {
  const invalidActivities = jsonData.activities.filter((a, index) => !a || !a.activity);
  if (invalidActivities.length > 0) {
    console.log(`\n=== AKTIVITAS TIDAK VALID ===`);
    console.log(`Jumlah aktivitas tidak valid: ${invalidActivities.length}`);
  }
}

console.log('\n=== STATISTIK LAINNYA ===');
if (jsonData) {
  console.log(`Jumlah zona: ${jsonData.zones ? jsonData.zones.length : 0}`);
  console.log(`Jumlah regulasi: ${jsonData.regulations ? Object.keys(jsonData.regulations).length : 0}`);
}

// Let's also check the difference between expected (1801) and actual (1766)
const expectedCount = 1801;
const difference = expectedCount - jsonCount;
console.log(`\n=== ANALISIS PERBEDAAN ===`);
console.log(`Jumlah yang diharapkan: ${expectedCount}`);
console.log(`Jumlah aktual: ${jsonCount}`);
console.log(`Perbedaan: ${difference} aktivitas`);

// Let's try to find where the missing activities might be
// by checking if there are any patterns in the raw text that might indicate missing data
const lines = rawData.split('\n');
let activityLineNumbers = [];

lines.forEach((line, index) => {
  if (line.includes('"activity":')) {
    activityLineNumbers.push(index + 1); // 1-indexed
  }
});

console.log(`\n=== ANALISIS BARIS ===`);
console.log(`Total baris dalam file: ${lines.length}`);
console.log(`Baris yang mengandung "activity": ${activityLineNumbers.length}`);
console.log(`Baris pertama dengan "activity": ${activityLineNumbers[0]}`);
console.log(`Baris terakhir dengan "activity": ${activityLineNumbers[activityLineNumbers.length - 1]}`);

// Check if there are any gaps in the activity line numbers that might indicate missing activities
if (activityLineNumbers.length !== jsonCount) {
  console.log(`\nPERINGATAN: Jumlah baris dengan "activity" (${activityLineNumbers.length}) tidak sama dengan jumlah aktivitas dalam JSON (${jsonCount})`);
}