import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca data intensitas BSB
const intensitasDataPath = path.join(__dirname, '..', '..', 'app', 'data', 'intensitas-data-merged-bsb.json');
const intensitasData = JSON.parse(fs.readFileSync(intensitasDataPath, 'utf8'));

// Baca data BSB untuk kegiatan
const bsbDataPath = path.join(__dirname, '..', '..', 'app', 'data', 'bsb-data.json');
const bsbData = JSON.parse(fs.readFileSync(bsbDataPath, 'utf8'));

// Daftar zona BSB
const zonaList = [
    'Badan Air',
    'Badan Jalan',
    'Cagar Budaya',
    'Ekosistem Mangrove',
    'Hortikultura',
    'Hutan Lindung',
    'Hutan Produksi Terbatas',
    'Hutan Produksi Tetap',
    'Jalur Hijau',
    'Kawasan Peruntukan Industri',
    'Pariwisata',
    'Pemakaman',
    'Perdagangan dan Jasa Skala Kota',
    'Perdagangan dan Jasa Skala SWP',
    'Perdagangan dan Jasa Skala WP',
    'Perikanan Budi Daya',
    'Perkantoran',
    'Perkebunan',
    'Perlindungan Setempat',
    'Pertahanan dan Keamanan',
    'Perumahan Kepadatan Rendah',
    'Perumahan Kepadatan Sedang',
    'Perumahan Kepadatan Tinggi',
    'Ruang Terbuka Non Hijau',
    'SPU Skala Kecamatan',
    'SPU Skala Kelurahan',
    'SPU Skala Kota',
    'SPU Skala RW',
    'Taman Kecamatan',
    'Taman Kelurahan',
    'Taman Kota',
    'Taman RT',
    'Taman RW',
    'Tanaman Pangan'
];

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

// Fungsi untuk mendapatkan kegiatan yang diizinkan (I) untuk zona tertentu
function getKegiatanDiizinkan(zona) {
    const kegiatanDiizinkan = [];
    
    try {
        bsbData.activities.forEach(activity => {
            // Cari zona yang sesuai dalam activity.zones
            const zoneKeys = Object.keys(activity.zones);
            const matchingZone = zoneKeys.find(key => {
                const keyLower = key.toLowerCase();
                const zonaLower = zona.toLowerCase();
                return keyLower.includes(zonaLower) || zonaLower.includes(keyLower);
            });
            
            if (matchingZone && activity.zones[matchingZone] === 'I') {
                kegiatanDiizinkan.push(activity.activity);
            }
        });
        
        // Kembalikan semua kegiatan yang diizinkan tanpa pembatasan
        const sortedKegiatan = kegiatanDiizinkan.sort();
        const joinedKegiatan = sortedKegiatan.join('\n');
        
        // Handle Excel's 32767 character limit by splitting into chunks
        if (joinedKegiatan.length > 32767) {
            console.log(`⚠️  Warning: Kegiatan list for zona ${zona} exceeds Excel limit (${joinedKegiatan.length} chars). Splitting into chunks...`);
            // Split into chunks of ~30000 characters to be safe
            const chunks = [];
            const chunkSize = 30000;
            const activities = sortedKegiatan;
            
            let currentChunk = '';
            for (const activity of activities) {
                if ((currentChunk + activity + '\n').length > chunkSize && currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = activity + '\n';
                } else {
                    currentChunk += activity + '\n';
                }
            }
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());
            }
            
            return chunks; // Return array of chunks instead of single string
        }
        
        return joinedKegiatan;
    } catch (error) {
        console.error(`Error processing kegiatan for zona ${zona}:`, error.message);
        return 'Error memproses data kegiatan';
    }
}

// Fungsi utama untuk generate Excel BSB
function generateExcelBSB() {
    console.log('Memulai generate Excel BSB...');
    
    // Buat header sesuai struktur yang diminta
    const headers = [
        'No.',
        'Koordinat',
        'Kodunk',
        'Kode Zona',
        'Zona',
        'RDTR Interaktif/Parkiran',
        'Perda',
        'Cek',
        'FIND',
        'Kesesuaian',
        'RDTR Interaktif/Parkiran',
        'Perda',
        'Cek',
        'FIND',
        'Kesesuaian',
        'RDTR Interaktif/Parkiran',
        'Perda',
        'Cek',
        'FIND',
        'Kesesuaian',
        'RDTR Interaktif/Parkiran',
        'Perda',
        'Cek',
        'FIND',
        'Kesesuaian',
        'RDTR Interaktif/Parkiran',
        'Perda',
        'Cek',
        'FIND',
        'Kesesuaian',
        'RDTR Interaktif/Parkiran',
        'Perda',
        'Cek',
        'FIND',
        'Kesesuaian'
    ];
    
    // Buat sub header untuk menjelaskan blok
    const subHeaders = [
        '', '', '', '', '',
        'Ketentuan Intensitas Pemanfaatan Ruang', '', '', '', '',
        'Kegiatan Diizinkan', '', '', '', '',
        'Kegiatan Terbatas', '', '', '', '',
        'Kegiatan Bersyarat', '', '', '', '',
        'Kegiatan Bersyarat Terbatas', '', '', '', '',
        'Keterangan', '', '', '', ''
    ];
    
    const data = [subHeaders, headers];
    
    // Generate data untuk setiap zona
    zonaList.forEach((zona, index) => {
        console.log(`Processing zona: ${zona}`);
        
        try {
            const intensitasItem = findIntensitasData(zona);
            const kegiatanDiizinkan = getKegiatanDiizinkan(zona);
            
            // Handle chunked data for large activity lists
            if (Array.isArray(kegiatanDiizinkan)) {
                // If data is chunked, create multiple rows
                kegiatanDiizinkan.forEach((chunk, chunkIndex) => {
                    const row = [
                        index + 1, // No
                        '', // Koordinat - kosong
                        '', // Kodunk - kosong
                        '', // Kode Zona - kosong
                        chunkIndex === 0 ? zona : `${zona} (Part ${chunkIndex + 1})`, // Zona
                        '', // F: RDTR Interaktif/Parkiran - kosong
                        chunkIndex === 0 ? (intensitasItem ? generateIntensitasForExcel(intensitasItem) : 'Data intensitas tidak ditemukan') : '', // G: Perda - Intensitas
                        '', // H: Cek - kosong
                        '', // I: FIND - kosong
                        '', // J: Kesesuaian - kosong
                        '', // K: RDTR Interaktif/Parkiran - kosong
                        chunk, // L: Perda - Kegiatan Diizinkan (chunk)
                        '', // M: Cek - kosong
                        '', // N: FIND - kosong
                        '', // O: Kesesuaian - kosong
                        '', // P: RDTR Interaktif/Parkiran - kosong
                        '', // Q: Perda - Kegiatan Terbatas - kosong
                        '', // R: Cek - kosong
                        '', // S: FIND - kosong
                        '', // T: Kesesuaian - kosong
                        '', // U: RDTR Interaktif/Parkiran - kosong
                        '', // V: Perda - Kegiatan Bersyarat - kosong
                        '', // W: Cek - kosong
                        '', // X: FIND - kosong
                        '', // Y: Kesesuaian - kosong
                        '', // Z: RDTR Interaktif/Parkiran - kosong
                        '', // AA: Perda - Kegiatan Bersyarat Terbatas - kosong
                        '', // AB: Cek - kosong
                        '', // AC: FIND - kosong
                        '', // AD: Kesesuaian - kosong
                        '', // AE: RDTR Interaktif/Parkiran - kosong
                        '', // AF: Perda - Keterangan - kosong
                        '', // AG: Cek - kosong
                        '', // AH: FIND - kosong
                        ''  // AI: Kesesuaian - kosong
                    ];
                    data.push(row);
                });
            } else {
                // Normal single row for zones with data under the limit
                const row = [
                    index + 1, // No
                    '', // Koordinat - kosong
                    '', // Kodunk - kosong
                    '', // Kode Zona - kosong
                    zona, // Zona
                    '', // F: RDTR Interaktif/Parkiran - kosong
                    intensitasItem ? generateIntensitasForExcel(intensitasItem) : 'Data intensitas tidak ditemukan', // G: Perda - Intensitas
                    '', // H: Cek - kosong
                    '', // I: FIND - kosong
                    '', // J: Kesesuaian - kosong
                    '', // K: RDTR Interaktif/Parkiran - kosong
                    kegiatanDiizinkan || 'Tidak ada kegiatan diizinkan', // L: Perda - Kegiatan Diizinkan
                    '', // M: Cek - kosong
                    '', // N: FIND - kosong
                    '', // O: Kesesuaian - kosong
                    '', // P: RDTR Interaktif/Parkiran - kosong
                    '', // Q: Perda - Kegiatan Terbatas - kosong
                    '', // R: Cek - kosong
                    '', // S: FIND - kosong
                    '', // T: Kesesuaian - kosong
                    '', // U: RDTR Interaktif/Parkiran - kosong
                    '', // V: Perda - Kegiatan Bersyarat - kosong
                    '', // W: Cek - kosong
                    '', // X: FIND - kosong
                    '', // Y: Kesesuaian - kosong
                    '', // Z: RDTR Interaktif/Parkiran - kosong
                    '', // AA: Perda - Kegiatan Bersyarat Terbatas - kosong
                    '', // AB: Cek - kosong
                    '', // AC: FIND - kosong
                    '', // AD: Kesesuaian - kosong
                    '', // AE: RDTR Interaktif/Parkiran - kosong
                    '', // AF: Perda - Keterangan - kosong
                    '', // AG: Cek - kosong
                    '', // AH: FIND - kosong
                    ''  // AI: Kesesuaian - kosong
                ];
                data.push(row);
            }
            
            if (intensitasItem) {
                console.log(`✅ Updated data for: ${zona}`);
            } else {
                console.log(`⚠️  No intensitas data found for: ${zona}`);
            }
        } catch (error) {
            console.error(`Error processing zona ${zona}:`, error.message);
            // Add empty row to maintain structure
            const emptyRow = new Array(35).fill('');
            emptyRow[0] = index + 1;
            emptyRow[4] = zona;
            emptyRow[6] = 'Error memproses data';
            emptyRow[11] = 'Error memproses data';
            data.push(emptyRow);
        }
    });
    
    // Buat worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    const colWidths = [
        { wch: 5 },   // A: No
        { wch: 30 },  // B: Koordinat
        { wch: 20 },  // C: Kodunk
        { wch: 15 },  // D: Kode Zona
        { wch: 35 },  // E: Zona
        { wch: 15 },  // F: RDTR Interaktif/Parkiran
        { wch: 80 },  // G: Perda (lebih lebar untuk text panjang)
        { wch: 15 },  // H: Cek
        { wch: 15 },  // I: FIND
        { wch: 15 },  // J: Kesesuaian
        { wch: 15 },  // K: RDTR Interaktif/Parkiran
        { wch: 80 },  // L: Perda (lebih lebar untuk kegiatan)
        { wch: 15 },  // M: Cek
        { wch: 15 },  // N: FIND
        { wch: 15 },  // O: Kesesuaian
    ];
    
    // Tambahkan width untuk kolom sisanya
    for (let i = 15; i < 35; i++) {
        colWidths.push({ wch: 15 });
    }
    
    worksheet['!cols'] = colWidths;
    
    // Buat workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Simpan file
    const outputPath = path.join(__dirname, '..', '..', 'app', 'data', 'uji titik', 'uji-titik-bsb.xlsx');
    
    try {
        XLSX.writeFile(workbook, outputPath);
    } catch (error) {
        console.error('Error writing Excel file:', error.message);
        // Try alternative path
        const altOutputPath = path.join(__dirname, 'uji-titik-bsb.xlsx');
        console.log(`Trying alternative path: ${altOutputPath}`);
        XLSX.writeFile(workbook, altOutputPath);
        console.log(`✅ File saved to alternative location: ${altOutputPath}`);
        return;
    }
    
    console.log(`\n✅ File Excel BSB berhasil dibuat: ${outputPath}`);
    console.log('📋 Kolom G (Perda) berisi data intensitas dari intensitas-data-merged-bsb.json');
    console.log('📋 Kolom L (Perda) berisi kegiatan yang diizinkan (I) dari bsb-data.json');
    console.log('📝 Kolom lainnya masih kosong untuk diisi manual');
}

// Fungsi untuk menampilkan preview zona yang akan diproses
function previewZonaBSB() {
    console.log('Preview zona BSB yang akan diproses:\n');
    
    zonaList.forEach(zona => {
        const intensitasItem = findIntensitasData(zona);
        const kegiatanCount = getKegiatanDiizinkan(zona).split('\n').filter(k => k.trim()).length;
        const intensitasStatus = intensitasItem ? '✅ Ada data intensitas' : '⚠️  Tidak ada data intensitas';
        const kegiatanStatus = kegiatanCount > 0 ? `✅ ${kegiatanCount} kegiatan diizinkan` : '⚠️  Tidak ada kegiatan diizinkan';
        
        console.log(`${zona.padEnd(35)} ${intensitasStatus} | ${kegiatanStatus}`);
    });
    
    console.log(`\nTotal zona: ${zonaList.length}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--preview')) {
    previewZonaBSB();
} else {
    generateExcelBSB();
}

// Export functions
export {
    generateExcelBSB,
    previewZonaBSB,
    generateIntensitasForExcel,
    findIntensitasData,
    getKegiatanDiizinkan
};