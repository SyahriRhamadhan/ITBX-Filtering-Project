import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mendapatkan __dirname dalam ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path ke file JSON
const rdtrDataPath = path.join(__dirname, '..', 'app', 'data', 'rdtr-data.json');
const bsbDataPath = path.join(__dirname, '..', 'app', 'data', 'bsb-data.json');

// Fungsi untuk menambahkan nomor urut pada aktivitas
function addActivityNumbers(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    // Baca file JSON
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Pastikan struktur data sesuai yang diharapkan
    if (!data.activities || !Array.isArray(data.activities)) {
      console.error('Format file tidak sesuai: tidak ada array activities');
      return;
    }
    
    // Tambahkan nomor urut pada setiap aktivitas
    const totalActivities = data.activities.length;
    
    // Buat JSON baru dengan struktur yang dimodifikasi
    const modifiedActivities = data.activities.map((item, index) => {
      // Format nomor dengan padding nol di depan
      const activityNumber = String(index + 1).padStart(3, '0');
      
      // Format nomor urut dalam bentuk "001-1801"
      const maxNumber = String(totalActivities).padStart(3, '0');
      const activityNumberRange = `${activityNumber}-${maxNumber}`;
      
      // Buat objek baru dengan urutan properti yang diinginkan
      const newItem = {};
      
      // Salin semua properti dari item asli ke objek baru
      Object.keys(item).forEach(key => {
        // Tambahkan properti activity terlebih dahulu
        if (key === 'activity') {
          newItem[key] = item[key];
          // Tambahkan properti activityNumber setelah activity
          newItem['activityNumber'] = activityNumberRange;
        } else {
          // Tambahkan properti lainnya
          newItem[key] = item[key];
        }
      });
      
      return newItem;
    });
    
    // Ganti array activities dengan yang baru
    data.activities = modifiedActivities;
    
    // Simpan hasil ke file baru dengan suffix -numbered
    const fileNameParts = path.basename(filePath).split('.');
    const newFileName = `${fileNameParts[0]}-numbered.${fileNameParts[1]}`;
    const outputPath = path.join(path.dirname(filePath), newFileName);
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`File berhasil diproses dan disimpan ke: ${outputPath}`);
    console.log(`Total aktivitas yang diproses: ${data.activities.length}`);
  } catch (error) {
    console.error(`Error saat memproses file ${filePath}:`, error);
  }
}

// Proses kedua file
addActivityNumbers(rdtrDataPath);
addActivityNumbers(bsbDataPath);

console.log('Proses selesai!');