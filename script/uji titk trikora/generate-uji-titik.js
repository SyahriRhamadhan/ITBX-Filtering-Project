import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Daftar zona dari catatan.txt (menghilangkan duplikat)
const zonaList = [
  'Badan Air',
  'Badan Jalan',
  'Cagar Budaya',
  'Ekosistem Mangrove',
  'Hutan Lindung',
  'Hutan Produksi Tetap',
  'Hutan Produksi yang dapat Dikonversi',
  'Jalur Hijau',
  'Kawasan Peruntukan Industri',
  'Pariwisata',
  'Pemakaman',
  'Perdagangan dan Jasa Skala SWP',
  'Perdagangan dan Jasa Skala WP',
  'Perkantoran',
  'Perkebunan',
  'Perlindungan Setempat',
  'Pertahanan dan Keamanan',
  'Pertambangan Mineral Bukan Logam',
  'Perumahan Kepadatan Rendah',
  'Perumahan Kepadatan Sedang',
  'Perumahan Kepadatan Tinggi',
  'Peternakan',
  'Ruang Terbuka Non Hijau',
  'SPU Skala Kecamatan',
  'SPU Skala Kelurahan',
  'SPU Skala Kota',
  'SPU Skala RW',
  'Taman Kelurahan',
  'Taman RT',
  'Taman RW',
  'Transportasi'
];

// Fungsi untuk membaca file Excel yang sudah ada (tidak digunakan karena buat dari awal)
function readExistingFile() {
  return null; // Selalu return null untuk membuat dari awal
}

// Fungsi untuk membuat header Excel dengan format lengkap
function createHeaders() {
  const headers = [];
  
  // Baris 1 - Header utama dengan merged cells
  const row1 = [];
  row1[0] = 'No.';
  row1[1] = 'Koordinat';
  row1[2] = 'Kodunk';
  row1[3] = 'Kode Zona';
  row1[4] = 'Zona';
  row1[5] = 'Ketentuan Intensitas Pemanfaatan Ruang';
  row1[10] = 'Kegiatan Diizinkan';
  row1[15] = 'Kegiatan Terbatas';
  row1[20] = 'Kegiatan Bersyarat';
  row1[25] = 'Kegiatan Bersyarat Terbatas';
  row1[30] = 'Keterangan';
  
  // Baris 2 - Sub header
  const row2 = [];
  // Kolom F-J: Ketentuan Intensitas
  row2[5] = 'RDTR Interaktif/Parkiran';
  row2[6] = 'Perda';
  row2[7] = 'Cek';
  row2[8] = 'FIND';
  row2[9] = 'Kesesuaian';
  // Kolom K-O: Kegiatan Diizinkan
  row2[10] = 'RDTR Interaktif/Parkiran';
  row2[11] = 'Perda';
  row2[12] = 'Cek';
  row2[13] = 'FIND';
  row2[14] = 'Kesesuaian';
  // Kolom P-T: Kegiatan Terbatas
  row2[15] = 'RDTR Interaktif/Parkiran';
  row2[16] = 'Perda';
  row2[17] = 'Cek';
  row2[18] = 'FIND';
  row2[19] = 'Kesesuaian';
  // Kolom U-Y: Kegiatan Bersyarat
  row2[20] = 'RDTR Interaktif/Parkiran';
  row2[21] = 'Perda';
  row2[22] = 'Cek';
  row2[23] = 'FIND';
  row2[24] = 'Kesesuaian';
  // Kolom Z-AD: Kegiatan Bersyarat Terbatas
  row2[25] = 'RDTR Interaktif/Parkiran';
  row2[26] = 'Perda';
  row2[27] = 'Cek';
  row2[28] = 'FIND';
  row2[29] = 'Kesesuaian';
  // Kolom AE-AI: Keterangan
  row2[30] = 'RDTR Interaktif/Parkiran';
  row2[31] = 'Perda';
  row2[32] = 'Cek';
  row2[33] = 'FIND';
  row2[34] = 'Kesesuaian';
  
  headers.push(row1);
  headers.push(row2);
  
  return headers;
}

// Fungsi untuk generate data zona dengan format baru (jarak 1 baris antar nomor)
function generateZonaData() {
  const data = [];
  let currentNo = 1;
  
  zonaList.forEach((zona, zonaIndex) => {
    // 3 titik koordinat per zona
    for (let titik = 1; titik <= 3; titik++) {
      const row = [];
      
      row[0] = currentNo; // No.
      row[1] = `[Koordinat ${zona} ${titik}]`; // Koordinat - akan diisi manual
      row[2] = `[Kodunk ${zona} ${titik}]`; // Kodunk - akan diisi manual
      row[3] = `[Kode ${zona}]`; // Kode Zona - akan diisi manual
      row[4] = zona; // Zona
      
      data.push(row);
      
      // Tambahkan baris kosong setelah setiap nomor (jarak 1 baris)
      data.push([]);
      
      currentNo++;
    }
  });
  
  return data;
}

// Fungsi utama untuk generate Excel
function generateExcel() {
  console.log('Memulai generate file Excel uji titik Trikora...');
  
  // Buat workbook baru
  const workbook = XLSX.utils.book_new();
  
  // Gabungkan header dan data
  const headers = createHeaders();
  const zonaData = generateZonaData();
  const allData = [...headers, ...zonaData];
  
  // Buat worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(allData);
  
  // Set column widths
  const colWidths = [
    { wch: 5 },   // A: No
    { wch: 30 },  // B: Koordinat
    { wch: 20 },  // C: Kodunk
    { wch: 15 },  // D: Kode Zona
    { wch: 35 },  // E: Zona
  ];
  
  // Tambahkan width untuk kolom tambahan
  for (let i = 5; i < 20; i++) {
    colWidths.push({ wch: 15 });
  }
  
  worksheet['!cols'] = colWidths;
  
  // Tambahkan worksheet ke workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  // Simpan file
  const outputPath = path.join(process.cwd(), 'app', 'data', 'uji titik', 'trikora-uji-titik-generated.xlsx');
  XLSX.writeFile(workbook, outputPath);
  
  console.log(`File Excel berhasil dibuat: ${outputPath}`);
  console.log(`Total zona: ${zonaList.length}`);
  console.log(`Total titik koordinat: ${zonaList.length * 3}`);
  console.log(`Total baris data (termasuk header dan pemisah): ${allData.length}`);
}

// Jalankan generator
generateExcel();