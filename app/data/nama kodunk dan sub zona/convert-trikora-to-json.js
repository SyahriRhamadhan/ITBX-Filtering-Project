import fs from 'fs';

// Membaca data Trikora zones
const trikoraZones = JSON.parse(fs.readFileSync('trikora-zones-clean.json', 'utf8'));
console.log('Zone data:', Object.keys(trikoraZones.zoneGroups).length, 'zone groups');

// Membaca data RDTR
const rdtrData = JSON.parse(fs.readFileSync('../rdtr-data.json', 'utf8'));
console.log('RDTR data:', rdtrData.activities?.length || 0, 'activities');

// Membuat mapping kodunk ke nama zona
const kodunkToZone = {};
for (const [groupKey, zones] of Object.entries(trikoraZones.zoneGroups)) {
  if (Array.isArray(zones)) {
    zones.forEach(zone => {
      kodunkToZone[zone.kodunk] = zone.name;
    });
  }
}

console.log('Kodunk mapping:', Object.keys(kodunkToZone).length, 'zones mapped');

// Mapping nama zona RDTR ke Trikora (menangani perbedaan nama)
const zoneNameMapping = {
  "Hutan Produksi yang Dapat di Konversi": "Hutan Produksi yang dapat Dikonversi",
  "Perdagangan Skala SWP": "Perdagangan dan Jasa Skala SWP",
  "Peruntukan Pertambangan Mineral Non Logam": "Pertambangan Mineral Bukan Logam"
};

// Inisialisasi struktur data sesuai format contoh
const convertedData = [];

// Membuat struktur untuk setiap kodunk
Object.keys(kodunkToZone).forEach(kodunk => {
  const zoneData = {};
  zoneData[kodunk] = {
    "iznktg": { "data": [] },    // Kegiatan yang diizinkan (I)
    "tbtktg": { "data": [] },    // Kegiatan terbatas (T1,T2,T3)
    "bstktg": { "data": [] },    // Kegiatan bersyarat (B1,B2,B3)
    "tbsktg": { "data": [] }     // Kegiatan terbatas bersyarat (T1,T2,T3 + B1,B2,B3)
  };
  convertedData.push(zoneData);
});

let allowedCount = 0;
let limitedCount = 0;
let conditionalCount = 0;
let mixedCount = 0;

// Tracking untuk debugging
const unmappedZones = new Set();
const processedZones = new Set();
const zoneActivityCount = {};

// Proses setiap aktivitas
rdtrData.activities?.forEach(activity => {
  const activityNumber = activity.activityNumber;
  const activityName = activity.activity;
  
  // Proses setiap zona dalam aktivitas
  Object.entries(activity.zones).forEach(([zoneName, permission]) => {
    // Skip jika permission adalah 'X' (tidak diizinkan)
    if (permission === 'X') return;
    
    // Normalisasi nama zona menggunakan mapping
    const normalizedZoneName = zoneNameMapping[zoneName] || zoneName;
    
    // Cari semua kodunk berdasarkan nama zona yang sudah dinormalisasi
    let matchingKodunks = [];
    
    // Coba cari exact match dulu
    matchingKodunks = Object.keys(kodunkToZone).filter(key => 
      kodunkToZone[key] === normalizedZoneName
    );
    
    // Jika tidak ditemukan, coba tanpa kata "Zona"
    if (matchingKodunks.length === 0) {
      const zoneNameWithoutZona = normalizedZoneName.replace(/^Zona\s+/, '');
      matchingKodunks = Object.keys(kodunkToZone).filter(key => 
        kodunkToZone[key] === zoneNameWithoutZona
      );
    }
    
    // Jika masih tidak ditemukan, coba dengan kata "Zona" ditambahkan
    if (matchingKodunks.length === 0) {
      const zoneNameWithZona = `Zona ${normalizedZoneName}`;
      matchingKodunks = Object.keys(kodunkToZone).filter(key => 
        kodunkToZone[key] === zoneNameWithZona
      );
    }
    
    // Jika masih tidak ditemukan, coba partial match
    if (matchingKodunks.length === 0) {
      matchingKodunks = Object.keys(kodunkToZone).filter(key => {
        const mappedName = kodunkToZone[key].toLowerCase();
        const searchName = normalizedZoneName.toLowerCase();
        return mappedName.includes(searchName) || searchName.includes(mappedName);
      });
    }
    
    // Proses semua kodunk yang cocok
    matchingKodunks.forEach(kodunk => {
        // Cari objek zona yang sesuai
        const zoneObj = convertedData.find(item => item[kodunk]);
        
        if (zoneObj) {
          // Track zona yang berhasil diproses
          processedZones.add(normalizedZoneName);
          if (!zoneActivityCount[kodunk]) {
            zoneActivityCount[kodunk] = 0;
          }
          zoneActivityCount[kodunk]++;
        
          // Definisi penjelasan keterangan
          const explanations = {
            'I': 'Diizinkan',
            'T1': 'T1 = Terbatas dengan pembatasan intensitas 20% pembangunan pada suatu kegiatan di luar zona/sub zona di dalam sebuah kaveling/persil.',
            'T2': 'T2 = Terbatas waktu pengoperasian pukul 07.00 - 24.00 untuk kegiatan diluar zona/sub zona atau sesuai dengan aturan yang berlaku.',
            'T3': 'T3 = Terbatas dengan jarak minimal 100 meter untuk kegiatan sejenis dalam zona.',
            'B1': 'B1 = Diperbolehkan dengan syarat  harus memiliki bukti izin pemanfaatan beserta persetujuan dari warga/ketua Rukun Tetangga, instansi yang berwenang, serta Forum Penataan Ruang (FPR) jika dibutuhkan.',
            'B2': 'B2 = Diperbolehkan dengan syarat harus menyediakan lahan parkir dan/atau ruang terbuka hijau dalam kavling/persil.',
            'B3': 'B3 = Diperbolehkan dengan syarat harus mempertimbangkan aspek kebersihan, kesehatan, keamanan dan ketertiban dengan menyediakan sarana dan prasarana minimal.'
          };
        
          // Function untuk menambahkan activity tanpa duplikasi
          const addActivityToCategory = (category, activityNumber, explanationTexts) => {
            // Cek apakah activity sudah ada
            const existingActivity = category.data.find(item => item[activityNumber]);
            if (!existingActivity) {
              const activityData = {};
              activityData[activityNumber] = explanationTexts;
              category.data.push(activityData);
            }
          };
        
          // Kategorikan berdasarkan permission
          if (permission === 'I') {
            addActivityToCategory(zoneObj[kodunk].iznktg, activityNumber, [explanations['I']]);
            allowedCount++;
          } else if (permission.match(/^T[1-3]$/)) {
            addActivityToCategory(zoneObj[kodunk].tbtktg, activityNumber, [explanations[permission]]);
            limitedCount++;
          } else if (permission.match(/^B[1-3]$/)) {
            addActivityToCategory(zoneObj[kodunk].bstktg, activityNumber, [explanations[permission]]);
            conditionalCount++;
          } else if (permission.includes('T') && permission.includes('B')) {
            // Kegiatan yang memiliki syarat terbatas dan bersyarat
            const permissions = permission.split(',').map(p => p.trim());
            const explanationTexts = permissions.map(perm => explanations[perm]).filter(Boolean);
            addActivityToCategory(zoneObj[kodunk].tbsktg, activityNumber, explanationTexts);
            mixedCount++;
          } else if (permission.includes(',')) {
            // Handle multiple permissions (e.g., "B1,B3", "T1,B2")
            const permissions = permission.split(',').map(p => p.trim());
            const explanationTexts = permissions.map(perm => explanations[perm]).filter(Boolean);
            
            // Tentukan kategori berdasarkan jenis permission
            const hasT = permissions.some(p => p.match(/^T[1-3]$/));
            const hasB = permissions.some(p => p.match(/^B[1-3]$/));
            const hasI = permissions.some(p => p === 'I');
            
            if (hasT && hasB) {
              addActivityToCategory(zoneObj[kodunk].tbsktg, activityNumber, explanationTexts);
              mixedCount++;
            } else if (hasT) {
              addActivityToCategory(zoneObj[kodunk].tbtktg, activityNumber, explanationTexts);
              limitedCount++;
            } else if (hasB) {
              addActivityToCategory(zoneObj[kodunk].bstktg, activityNumber, explanationTexts);
              conditionalCount++;
            } else if (hasI) {
              addActivityToCategory(zoneObj[kodunk].iznktg, activityNumber, explanationTexts);
              allowedCount++;
            }
          }
        }
    });
    
    if (matchingKodunks.length === 0) {
        // Track zona yang tidak berhasil dimapping
        unmappedZones.add(normalizedZoneName);
        console.log(`Warning: Zona tidak ditemukan mapping untuk: "${normalizedZoneName}" (original: "${zoneName}")`);
    }
  });
});

console.log('\nKonversi selesai:');
console.log('- Total zones:', convertedData.length);
console.log('- Kegiatan diizinkan (I):', allowedCount);
console.log('- Kegiatan terbatas (T1-T3):', limitedCount);
console.log('- Kegiatan bersyarat (B1-B3):', conditionalCount);
console.log('- Kegiatan terbatas bersyarat:', mixedCount);

// Debugging information
console.log('\n=== DEBUGGING INFORMATION ===');
console.log('- Zona yang berhasil diproses:', processedZones.size);
console.log('- Zona yang tidak berhasil dimapping:', unmappedZones.size);

if (unmappedZones.size > 0) {
  console.log('\nZona yang tidak berhasil dimapping:');
  Array.from(unmappedZones).sort().forEach(zone => {
    console.log(`  - ${zone}`);
  });
}

// Zona dengan 0 aktivitas
const emptyZones = [];
Object.keys(kodunkToZone).forEach(kodunk => {
  if (!zoneActivityCount[kodunk]) {
    emptyZones.push(`${kodunk} (${kodunkToZone[kodunk]})`);
  }
});

if (emptyZones.length > 0) {
  console.log('\nZona dengan 0 aktivitas (semua kategori kosong):');
  emptyZones.sort().forEach(zone => {
    console.log(`  - ${zone}`);
  });
}

console.log('\nStatistik aktivitas per zona (10 terendah):');
Object.entries(zoneActivityCount)
  .sort((a, b) => a[1] - b[1])
  .slice(0, 10)
  .forEach(([kodunk, count]) => {
    console.log(`  - ${kodunk} (${kodunkToZone[kodunk]}): ${count} aktivitas`);
  });

// Tampilkan contoh struktur
console.log('\nContoh struktur data:');
if (convertedData.length > 0) {
  const firstZone = convertedData[0];
  const kodunk = Object.keys(firstZone)[0];
  console.log(`Zona ${kodunk}:`);
  console.log(`- iznktg: ${firstZone[kodunk].iznktg.data.length} kegiatan`);
  console.log(`- tbtktg: ${firstZone[kodunk].tbtktg.data.length} kegiatan`);
  console.log(`- bstktg: ${firstZone[kodunk].bstktg.data.length} kegiatan`);
  console.log(`- tbsktg: ${firstZone[kodunk].tbsktg.data.length} kegiatan`);
}

// Simpan hasil konversi
fs.writeFileSync('trikora-converted.json', JSON.stringify(convertedData, null, 2));
console.log('\nData berhasil disimpan ke trikora-converted.json');