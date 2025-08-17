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
        
        // Kembalikan semua kegiatan yang diizinkan dengan batasan Excel
        const sortedKegiatan = kegiatanDiizinkan.sort();
        const joinedKegiatan = sortedKegiatan.join('\n');
        
        // Handle Excel's 32767 character limit - return array for splitting
        if (joinedKegiatan.length > 32767) {
            console.log(`⚠️  Warning: Kegiatan list for zona ${zona} exceeds Excel limit (${joinedKegiatan.length} chars). Will split into multiple rows...`);
            
            // Split into chunks that fit Excel limit
            const chunks = [];
            let currentChunk = '';
            
            for (const activity of sortedKegiatan) {
                const activityWithNewline = activity + '\n';
                if (currentChunk.length + activityWithNewline.length <= 32700) {
                    currentChunk += activityWithNewline;
                } else {
                    if (currentChunk) {
                        chunks.push(currentChunk.trim());
                    }
                    currentChunk = activityWithNewline;
                }
            }
            
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            
            return chunks; // Return array for multiple rows
        }
        
        return joinedKegiatan;
    } catch (error) {
        console.error(`Error processing kegiatan for zona ${zona}:`, error.message);
        return 'Error memproses data kegiatan';
    }
}

// Fungsi untuk mendapatkan kegiatan terbatas (T1, T2, T3) dan kombinasinya
function getKegiatanTerbatas(zona) {
    const kegiatanTerbatas = {
        T1: [],
        T2: [],
        T3: [],
        kombinasi: []
    };
    
    try {
        bsbData.activities.forEach(activity => {
            // Cari zona yang sesuai dalam activity.zones
            const zoneKeys = Object.keys(activity.zones);
            const matchingZone = zoneKeys.find(key => {
                const keyLower = key.toLowerCase();
                const zonaLower = zona.toLowerCase();
                return keyLower.includes(zonaLower) || zonaLower.includes(keyLower);
            });
            
            if (matchingZone) {
                const zoneValue = activity.zones[matchingZone];
                
                // Handle single T values (exact match only, no other codes)
                if (zoneValue === 'T1') {
                    kegiatanTerbatas.T1.push(activity.activity);
                } else if (zoneValue === 'T2') {
                    kegiatanTerbatas.T2.push(activity.activity);
                } else if (zoneValue === 'T3') {
                    kegiatanTerbatas.T3.push(activity.activity);
                }
                // Skip activities with mixed codes like (T1,B3) - these are not pure T codes
                
                // Handle combinations containing ONLY T1, T2, or T3 (no other codes like B3)
                if (zoneValue && zoneValue.includes(',')) {
                    const codes = zoneValue.split(',').map(c => c.trim());
                    const allValidTCodes = codes.every(code => ['T1', 'T2', 'T3'].includes(code));
                    if (allValidTCodes && codes.length > 1) {
                        kegiatanTerbatas.kombinasi.push({
                            activity: activity.activity,
                            codes: zoneValue
                        });
                    }
                }
            }
        });
        
        // Fungsi untuk membersihkan nama aktivitas dari kode dalam kurung
        const cleanActivityName = (activityName) => {
            // Hapus kode dalam kurung seperti (T1,T3), (T1,B3), dll
            return activityName.replace(/\s*\([^)]*\)\s*$/, '').trim();
        };
        
        // Format output untuk Excel - gabung semua kegiatan terbatas tanpa header kategori
        const allKegiatanTerbatas = [];
        
        // Gabungkan semua kegiatan terbatas dari T1, T2, T3 (bersihkan dari kode)
        allKegiatanTerbatas.push(...kegiatanTerbatas.T1.map(cleanActivityName));
        allKegiatanTerbatas.push(...kegiatanTerbatas.T2.map(cleanActivityName));
        allKegiatanTerbatas.push(...kegiatanTerbatas.T3.map(cleanActivityName));
        
        // Tambahkan kegiatan kombinasi (tanpa kode)
        kegiatanTerbatas.kombinasi.forEach(item => {
            allKegiatanTerbatas.push(cleanActivityName(item.activity));
        });
        
        // Sort ascending dan join
        const finalResult = allKegiatanTerbatas.length > 0 ? 
            allKegiatanTerbatas.sort().join('\n') : 
            '-';
        
        // Handle Excel's 32767 character limit for kegiatan terbatas - return array for splitting
        if (finalResult.length > 32767) {
            console.log(`⚠️  Warning: Kegiatan terbatas for zona ${zona} exceeds Excel limit (${finalResult.length} chars). Will split into multiple rows...`);
            
            // Split into chunks that fit Excel limit
            const chunks = [];
            let currentChunk = '';
            const sortedActivities = allKegiatanTerbatas.sort();
            
            for (const activity of sortedActivities) {
                const activityWithNewline = activity + '\n';
                if (currentChunk.length + activityWithNewline.length <= 32700) {
                    currentChunk += activityWithNewline;
                } else {
                    if (currentChunk) {
                        chunks.push(currentChunk.trim());
                    }
                    currentChunk = activityWithNewline;
                }
            }
            
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            
            return chunks; // Return array for multiple rows
        }
        
        return finalResult;
    } catch (error) {
        console.error(`Error processing kegiatan terbatas for zona ${zona}:`, error.message);
        return 'Error memproses data kegiatan terbatas';
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
    let rowNumber = 1;
    zonaList.forEach((zona, index) => {
        console.log(`Processing zona: ${zona}`);
        
        try {
            const intensitasItem = findIntensitasData(zona);
            const kegiatanDiizinkan = getKegiatanDiizinkan(zona);
            const kegiatanTerbatas = getKegiatanTerbatas(zona);
            
            // Handle splitting for large data
            const kegiatanDiizinkanArray = Array.isArray(kegiatanDiizinkan) ? kegiatanDiizinkan : [kegiatanDiizinkan];
            const kegiatanTerbatasArray = Array.isArray(kegiatanTerbatas) ? kegiatanTerbatas : [kegiatanTerbatas];
            
            // Determine maximum parts needed
            const maxParts = Math.max(kegiatanDiizinkanArray.length, kegiatanTerbatasArray.length);
            
            // Create rows for each part
            for (let partIndex = 0; partIndex < maxParts; partIndex++) {
                const zoneName = partIndex === 0 ? zona : `${zona} Part ${partIndex + 1}`;
                const kegiatanDiizinkanPart = kegiatanDiizinkanArray[partIndex] || '';
                const kegiatanTerbatasPart = kegiatanTerbatasArray[partIndex] || '';
                
                const row = [
                    rowNumber, // No
                    '', // Koordinat - kosong
                    '', // Kodunk - kosong
                    '', // Kode Zona - kosong
                    zoneName, // Zona (with Part suffix if needed)
                    '', // F: RDTR Interaktif/Parkiran - kosong
                    partIndex === 0 ? (intensitasItem ? generateIntensitasForExcel(intensitasItem) : '-') : '', // G: Perda - Intensitas (only on first row)
                    '', // H: Cek - kosong
                    '', // I: FIND - kosong
                    '', // J: Kesesuaian - kosong
                    '', // K: RDTR Interaktif/Parkiran - kosong
                    kegiatanDiizinkanPart || '-', // L: Perda - Kegiatan Diizinkan
                    '', // M: Cek - kosong
                    '', // N: FIND - kosong
                    '', // O: Kesesuaian - kosong
                    '', // P: RDTR Interaktif/Parkiran - kosong
                    kegiatanTerbatasPart || '-', // Q: Perda - Kegiatan Terbatas
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
                rowNumber++;
            }
            
            if (intensitasItem) {
                console.log(`✅ Updated data for: ${zona} (${maxParts} part${maxParts > 1 ? 's' : ''})`);
            } else {
                console.log(`⚠️  No intensitas data found for: ${zona}`);
            }
        } catch (error) {
            console.error(`Error processing zona ${zona}:`, error.message);
            // Add empty row to maintain structure
            const emptyRow = new Array(35).fill('');
            emptyRow[0] = rowNumber;
            emptyRow[4] = zona;
            emptyRow[6] = 'Error memproses data';
            emptyRow[11] = 'Error memproses data';
            data.push(emptyRow);
            rowNumber++;
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
        { wch: 15 },  // P: RDTR Interaktif/Parkiran
        { wch: 80 },  // Q: Perda - Kegiatan Terbatas (lebih lebar untuk kegiatan terbatas)
        { wch: 15 },  // R: Cek
        { wch: 15 },  // S: FIND
        { wch: 15 },  // T: Kesesuaian
    ];
    
    // Tambahkan width untuk kolom sisanya
    for (let i = 20; i < 35; i++) {
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
    console.log('📋 Kolom Q (Perda) berisi kegiatan terbatas (T1, T2, T3) dan kombinasinya dari bsb-data.json');
    console.log('📝 Kolom lainnya masih kosong untuk diisi manual');
    console.log('🚀 Pembatasan karakter Excel telah dihapus - data lengkap akan ditampilkan');
}

// Fungsi untuk menampilkan preview zona yang akan diproses
function previewZonaBSB() {
    console.log('Preview zona BSB yang akan diproses:\n');
    
    zonaList.forEach(zona => {
        const intensitasItem = findIntensitasData(zona);
        const kegiatanDiizinkan = getKegiatanDiizinkan(zona);
        const kegiatanTerbatas = getKegiatanTerbatas(zona);
        
        // Handle array or string for kegiatanDiizinkan
        let kegiatanCount = 0;
        if (Array.isArray(kegiatanDiizinkan)) {
            kegiatanCount = kegiatanDiizinkan.reduce((total, part) => {
                return total + (part ? part.split('\n').filter(k => k.trim()).length : 0);
            }, 0);
        } else if (kegiatanDiizinkan && kegiatanDiizinkan !== '-') {
            kegiatanCount = kegiatanDiizinkan.split('\n').filter(k => k.trim()).length;
        }
        
        // Handle array or string for kegiatanTerbatas
        let terbatasCount = 0;
        if (Array.isArray(kegiatanTerbatas)) {
            terbatasCount = kegiatanTerbatas.reduce((total, part) => {
                return total + (part && part !== '-' ? part.split('\n').filter(k => k.trim() && !k.includes(':')).length : 0);
            }, 0);
        } else if (kegiatanTerbatas && kegiatanTerbatas !== '-') {
            terbatasCount = kegiatanTerbatas.split('\n').filter(k => k.trim() && !k.includes(':')).length;
        }
        
        const intensitasStatus = intensitasItem ? '✅ Ada data intensitas' : '⚠️  Tidak ada data intensitas';
        const kegiatanStatus = kegiatanCount > 0 ? `✅ ${kegiatanCount} kegiatan diizinkan` : '⚠️  Tidak ada kegiatan diizinkan';
        const terbatasStatus = terbatasCount > 0 ? `✅ ${terbatasCount} kegiatan terbatas` : '⚠️  -';
        
        // Show if data is split into multiple parts
        const kegiatanParts = Array.isArray(kegiatanDiizinkan) ? kegiatanDiizinkan.length : 1;
        const terbatasParts = Array.isArray(kegiatanTerbatas) ? kegiatanTerbatas.length : 1;
        const maxParts = Math.max(kegiatanParts, terbatasParts);
        const partsInfo = maxParts > 1 ? ` (${maxParts} parts)` : '';
        
        console.log(`${zona.padEnd(35)} ${intensitasStatus} | ${kegiatanStatus} | ${terbatasStatus}${partsInfo}`);
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