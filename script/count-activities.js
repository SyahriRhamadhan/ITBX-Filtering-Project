const fs = require('fs');
const path = require('path');

// Read the JSON file as text first
const dataPath = path.join(__dirname, 'app', 'data', 'rdtr-data.json');
const fileContent = fs.readFileSync(dataPath, 'utf-8');

// Count occurrences of "activity": in the file
const activityMatches = fileContent.match(/"activity":/g);
const activityCount = activityMatches ? activityMatches.length : 0;

console.log('=== RDTR Data Analysis (Text-based) ===');
console.log(`Total "activity": occurrences: ${activityCount}`);

// Now try to parse as JSON
try {
  const data = JSON.parse(fileContent);
  console.log(`\n=== RDTR Data Analysis (JSON-based) ===`);
  console.log(`Total activities in JSON: ${data.activities.length}`);
  console.log(`Total zones: ${data.zones.length}`);
  console.log(`Total regulations: ${Object.keys(data.regulations).length}`);
  
  // Check if counts match
  if (activityCount === data.activities.length) {
    console.log('\n✅ Counts match! Data is consistent.');
  } else {
    console.log('\n❌ Counts do NOT match!');
    console.log(`Text-based count: ${activityCount}`);
    console.log(`JSON-based count: ${data.activities.length}`);
    console.log(`Difference: ${Math.abs(activityCount - data.activities.length)}`);
  }
  
} catch (error) {
  console.error('Error parsing JSON:', error.message);
}