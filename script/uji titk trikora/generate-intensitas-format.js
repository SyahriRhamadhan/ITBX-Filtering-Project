import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca data intensitas
const intensitasDataPath = path.join(__dirname, 'app', 'data', 'intensitas-data-merged.json');
const intensitasData = JSON.parse(fs.readFileSync(intensitasDataPath, 'utf8'));

// Fungsi untuk format nilai
function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    return value;
}

// Fungsi untuk format persentase
function formatPercentage(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    return `${value}%`;
}

// Fungsi untuk format meter
function formatMeter(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    return `${value} m`;
}

// Fungsi untuk generate format intensitas
function generateIntensitasFormat(item) {
    const subZona = item.SubZona || 'Unknown';
    const jenis = item.Jenis ? ` (${item.Jenis})` : '';
    
    return `
=== ${subZona}${jenis} ===

Koefisien Dasar Bangunan (%)
Maksimum: ${formatPercentage(item['KDB Maks (%)'])}

Koefisien Lantai Bangunan
KLB Maksimum: ${formatValue(item['KLB Maks'])}
KLB Minimum: -

Koefisien Dasar Hijau (%)
Minimum: ${formatValue(item['KDH Min (%)'])}

Luas Kaveling
Minimum: ${formatValue(item['Luas Kavling Min (m2)']) !== '-' ? item['Luas Kavling Min (m2)'] + ' m²' : '-'}

Ketinggian Bangunan
Persil disebelah barat jalan Nasional:
    a.: Jalan Arteri = -;
    b.: Jalan Kolektor = ${formatValue(item['Tinggi Bangunan Maks. (m) - Kolektor'])}; dan
    c.: Jalan Lokal = ${formatValue(item['Tinggi Bangunan Maks. (m) - Lokal'])}.
Persil disebelah timur jalan Nasional:
    a.: Jalan Arteri = -;
    b.: Jalan Kolektor = ${formatValue(item['Tinggi Bangunan Maks. (m) - Kolektor'])}; dan
    c.: Jalan Lokal = ${formatValue(item['Tinggi Bangunan Maks. (m) - Lokal'])}.

Koefisien Tapak Basement
${formatValue(item['KTB Maks (%)'])}

Garis Sempadan Bangunan
Persil disebelah barat jalan Nasional:
    a.: Jalan Arteri = -;
    b.: Jalan Kolektor = ${formatValue(item['Garis Sempadan Bangunan Min. (m) - Kolektor'])}; dan
    c.: Jalan Lokal = ${formatValue(item['Garis Sempadan Bangunan Min. (m) - Lokal'])}.
Persil disebelah timur jalan Nasional:
    a.: Jalan Arteri = -;
    b.: Jalan Kolektor = ${formatValue(item['Garis Sempadan Bangunan Min. (m) - Kolektor'])}; dan
    c.: Jalan Lokal = ${formatValue(item['Garis Sempadan Bangunan Min. (m) - Lokal'])}.

Jarak Bebas Samping (JBS)
Minimum: ${formatMeter(item['Jarak Bebas Samping Min. (m)'])}

Jarak Bebas Belakang (JBB)
Minimum: ${formatMeter(item['Jarak Bebas Belakang Min. (m)'])}

Lantai Bangunan
Maksimum Kolektor: ${formatValue(item['Lantai Bangunan Maks. - Kolektor'])}
Maksimum Lokal: ${formatValue(item['Lantai Bangunan Maks. - Lokal'])}

${item.Keterangan ? `Keterangan: ${item.Keterangan}\n` : ''}
${item['Tampilan Bangunan'] ? `Tampilan Bangunan: ${item['Tampilan Bangunan']}\n` : ''}
`;
}

// Generate untuk semua data
function generateAllFormats() {
    let output = '# KETENTUAN INTENSITAS PEMANFAATAN RUANG\n';
    output += '# Generated automatically from intensitas-data-merged.json\n\n';
    
    intensitasData.data.forEach((item, index) => {
        output += generateIntensitasFormat(item);
        output += '\n' + '='.repeat(80) + '\n';
    });
    
    return output;
}

// Generate untuk zona/subzona tertentu
function generateByFilter(zona = null, subZona = null) {
    let filteredData = intensitasData.data;
    
    if (zona) {
        filteredData = filteredData.filter(item => 
            item.Zona && item.Zona.toLowerCase().includes(zona.toLowerCase())
        );
    }
    
    if (subZona) {
        filteredData = filteredData.filter(item => 
            item.SubZona && item.SubZona.toLowerCase().includes(subZona.toLowerCase())
        );
    }
    
    let output = `# KETENTUAN INTENSITAS PEMANFAATAN RUANG\n`;
    if (zona || subZona) {
        output += `# Filter: ${zona || 'All Zona'} - ${subZona || 'All SubZona'}\n`;
    }
    output += `# Generated automatically from intensitas-data-merged.json\n\n`;
    
    filteredData.forEach((item, index) => {
        output += generateIntensitasFormat(item);
        output += '\n' + '='.repeat(80) + '\n';
    });
    
    return output;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    // Generate semua
    const output = generateAllFormats();
    fs.writeFileSync('intensitas-format-all.txt', output, 'utf8');
    console.log('✅ Generated: intensitas-format-all.txt');
} else if (args.length === 1) {
    // Filter by zona atau subzona
    const filter = args[0];
    const output = generateByFilter(null, filter);
    const filename = `intensitas-format-${filter.toLowerCase().replace(/\s+/g, '-')}.txt`;
    fs.writeFileSync(filename, output, 'utf8');
    console.log(`✅ Generated: ${filename}`);
} else if (args.length === 2) {
    // Filter by zona dan subzona
    const [zona, subZona] = args;
    const output = generateByFilter(zona, subZona);
    const filename = `intensitas-format-${zona.toLowerCase()}-${subZona.toLowerCase().replace(/\s+/g, '-')}.txt`;
    fs.writeFileSync(filename, output, 'utf8');
    console.log(`✅ Generated: ${filename}`);
}

// Export functions untuk digunakan di tempat lain
export {
    generateIntensitasFormat,
    generateAllFormats,
    generateByFilter,
    formatValue,
    formatPercentage,
    formatMeter
};

// Contoh penggunaan:
// node generate-intensitas-format.js                    // Generate semua
// node generate-intensitas-format.js "Badan Air"        // Generate untuk SubZona Badan Air
// node generate-intensitas-format.js "Zona Lindung" "Badan Air"  // Generate untuk Zona Lindung, SubZona Badan Air