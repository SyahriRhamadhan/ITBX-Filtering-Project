import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'app', 'data', 'uji titik', 'trikora-uji-titik-updated.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets['Sheet1'];
const range = XLSX.utils.decode_range(worksheet['!ref']);

console.log('=== Checking Excel Content ===');
console.log(`Total rows: ${range.e.r + 1}`);
console.log('');

// Check first 3 data rows (skip header)
for (let R = 1; R <= Math.min(3, range.e.r); R++) {
    const zonaCell = worksheet[XLSX.utils.encode_cell({c: 4, r: R})] || {v: ''};
    const perdaCell = worksheet[XLSX.utils.encode_cell({c: 6, r: R})] || {v: ''};
    
    console.log(`Row ${R + 1}:`);
    console.log(`  Zona: ${zonaCell.v}`);
    console.log(`  Kolom G (Perda):`);
    if (perdaCell.v) {
        const lines = perdaCell.v.split('\n');
        lines.slice(0, 10).forEach((line, index) => {
            console.log(`    ${index + 1}: ${line}`);
        });
        if (lines.length > 10) {
            console.log(`    ... (${lines.length - 10} more lines)`);
        }
    } else {
        console.log('    (kosong)');
    }
    console.log('');
}