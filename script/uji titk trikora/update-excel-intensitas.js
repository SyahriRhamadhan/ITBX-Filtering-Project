import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca data intensitas
const intensitasDataPath = path.join(__dirname, 'app', 'data', 'intensitas-data-merged.json');
const intensitasData = JSON.parse(fs.readFileSync(intensitasDataPath, 'utf8'));

// Path file Excel
const excelPath = path.join(__dirname, 'app', 'data', 'uji titik', 'trikora-uji-titik-generated.xlsx');

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

// Fungsi untuk generate format intensitas untuk Excel
function generateIntensitasForExcel(item) {
    const kdbMaks = formatPercentage(item['KDB Maks (%)']);
    const klbMaks = formatValue(item['KLB Maks']);
    const kdhMin = formatValue(item['KDH Min (%)']);
    const luasKavling = formatValue(item['Luas Kavling Min (m2)']) !== '-' ? item['Luas Kavling Min (m2)'] + ' m²' : '-';
    const tinggiKolektor = formatValue(item['Tinggi Bangunan Maks. (m) - Kolektor']);
    const tinggiLokal = formatValue(item['Tinggi Bangunan Maks. (m) - Lokal']);
    const ktbMaks = formatValue(item['KTB Maks (%)']);
    const gsb_kolektor = formatValue(item['Garis Sempadan Bangunan Min. (m) - Kolektor']);
    const gsb_lokal = formatValue(item['Garis Sempadan Bangunan Min. (m) - Lokal']);
    const jbs = formatMeter(item['Jarak Bebas Samping Min. (m)']);
    const jbb = formatMeter(item['Jarak Bebas Belakang Min. (m)']);
    const lantaiKolektor = formatValue(item['Lantai Bangunan Maks. - Kolektor']);
    const lantaiLokal = formatValue(item['Lantai Bangunan Maks. - Lokal']);
    
    return `Koefisien Dasar Bangunan (%)\nMaksimum: ${kdbMaks}\n\nKoefisien Lantai Bangunan\nKLB Maksimum: ${klbMaks}\nKLB Minimum: -\n\nKoefisien Dasar Hijau (%)\nMinimum: ${kdhMin}\n\nLuas Kaveling\nMinimum: ${luasKavling}\n\nKetinggian Bangunan\nPersil disebelah barat jalan Nasional:\na.: Jalan Arteri = -;\nb.: Jalan Kolektor = ${tinggiKolektor}; dan\nc.: Jalan Lokal = ${tinggiLokal}.\nPersil disebelah timur jalan Nasional:\na.: Jalan Arteri = -;\nb.: Jalan Kolektor = ${tinggiKolektor}; dan\nc.: Jalan Lokal = ${tinggiLokal}.\n\nKoefisien Tapak Basement\n${ktbMaks}\n\nGaris Sempadan Bangunan\nPersil disebelah barat jalan Nasional:\na.: Jalan Arteri = -;\nb.: Jalan Kolektor = ${gsb_kolektor}; dan\nc.: Jalan Lokal = ${gsb_lokal}.\nPersil disebelah timur jalan Nasional:\na.: Jalan Arteri = -;\nb.: Jalan Kolektor = ${gsb_kolektor}; dan\nc.: Jalan Lokal = ${gsb_lokal}.\n\nJarak Bebas Samping (JBS)\nMinimum: ${jbs}\n\nJarak Bebas Belakang (JBB)\nMinimum: ${jbb}\n\nLantai Bangunan\nMaksimum Kolektor: ${lantaiKolektor}\nMaksimum Lokal: ${lantaiLokal}`;
}

// Fungsi untuk mencari data intensitas berdasarkan zona
function findIntensitasData(zona) {
    return intensitasData.data.find(item => 
        item.SubZona && item.SubZona.toLowerCase() === zona.toLowerCase()
    );
}

// Fungsi utama untuk update Excel
function updateExcelWithIntensitas() {
    console.log('Memulai update Excel dengan data intensitas...');
    
    // Baca file Excel yang sudah ada
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['Sheet1'];
    
    // Convert worksheet ke array untuk mudah dimanipulasi
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    // Loop melalui data untuk mencari dan update zona
    for (let i = 2; i < data.length; i++) { // Mulai dari baris 3 (index 2) karena baris 1-2 adalah header
        const row = data[i];
        const zona = row[4]; // Kolom E (index 4) adalah kolom Zona
        
        if (zona && zona.trim() !== '') {
            console.log(`Processing zona: ${zona}`);
            
            // Cari data intensitas untuk zona ini
            const intensitasItem = findIntensitasData(zona);
            
            if (intensitasItem) {
                // Generate format intensitas
                const intensitasText = generateIntensitasForExcel(intensitasItem);
                
                // Update kolom G (index 6) dengan data intensitas - Perda
                row[6] = intensitasText;
                
                console.log(`✅ Updated intensitas for: ${zona}`);
            } else {
                console.log(`⚠️  No intensitas data found for: ${zona}`);
                // Tetap isi dengan format kosong
                row[6] = `Koefisien Dasar Bangunan (%)\nMaksimum: -\n\nKoefisien Lantai Bangunan\nKLB Maksimum: -\nKLB Minimum: -\n\nKoefisien Dasar Hijau (%)\nMinimum: -\n\nLuas Kaveling\nMinimum: -\n\nKetinggian Bangunan\nPersil disebelah barat jalan Nasional:\na.: Jalan Arteri = -;\nb.: Jalan Kolektor = -; dan\nc.: Jalan Lokal = -.\nPersil disebelah timur jalan Nasional:\na.: Jalan Arteri = -;\nb.: Jalan Kolektor = -; dan\nc.: Jalan Lokal = -.\n\nKoefisien Tapak Basement\n-\n\nGaris Sempadan Bangunan\nPersil disebelah barat jalan Nasional:\na.: Jalan Arteri = -;\nb.: Jalan Kolektor = -; dan\nc.: Jalan Lokal = -.\nPersil disebelah timur jalan Nasional:\na.: Jalan Arteri = -;\nb.: Jalan Kolektor = -; dan\nc.: Jalan Lokal = -.\n\nJarak Bebas Samping (JBS)\nMinimum: -\n\nJarak Bebas Belakang (JBB)\nMinimum: -\n\nLantai Bangunan\nMaksimum Kolektor: -\nMaksimum Lokal: -`;
            }
        }
    }
    
    // Convert array kembali ke worksheet
    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths (copy dari original)
    const colWidths = [
        { wch: 5 },   // A: No
        { wch: 30 },  // B: Koordinat
        { wch: 20 },  // C: Kodunk
        { wch: 15 },  // D: Kode Zona
        { wch: 35 },  // E: Zona
        { wch: 15 },  // F: RDTR Interaktif/Parkiran
        { wch: 80 },  // G: Perda (lebih lebar untuk text panjang)
    ];
    
    // Tambahkan width untuk kolom tambahan
    for (let i = 6; i < 35; i++) {
        colWidths.push({ wch: 15 });
    }
    
    newWorksheet['!cols'] = colWidths;
    
    // Update workbook dengan worksheet baru
    workbook.Sheets['Sheet1'] = newWorksheet;
    
    // Simpan file dengan nama baru untuk menghindari konflik file
    const outputPath = path.join(__dirname, 'app', 'data', 'uji titik', 'trikora-uji-titik-updated.xlsx');
    XLSX.writeFile(workbook, outputPath);
    
    console.log(`\n✅ File Excel berhasil diupdate: ${outputPath}`);
    console.log('📋 Kolom G (Perda) telah diisi dengan data intensitas dari intensitas-data-merged.json');
    console.log('📝 Kolom F (RDTR Interaktif/Parkiran), H (Cek), I (FIND), J (Kesesuaian) masih kosong untuk diisi manual');
}

// Fungsi untuk menampilkan preview zona yang akan diupdate
function previewZonaUpdate() {
    console.log('Preview zona yang akan diupdate:\n');
    
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['Sheet1'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    const zonaList = [];
    
    for (let i = 2; i < data.length; i++) {
        const zona = data[i][4];
        if (zona && zona.trim() !== '' && !zonaList.includes(zona)) {
            zonaList.push(zona);
            
            const intensitasItem = findIntensitasData(zona);
            const status = intensitasItem ? '✅ Ada data' : '⚠️  Tidak ada data';
            
            console.log(`${zona.padEnd(35)} ${status}`);
        }
    }
    
    console.log(`\nTotal zona unik: ${zonaList.length}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--preview')) {
    previewZonaUpdate();
} else {
    updateExcelWithIntensitas();
}

// Export functions
export {
    updateExcelWithIntensitas,
    previewZonaUpdate,
    generateIntensitasForExcel,
    findIntensitasData
};