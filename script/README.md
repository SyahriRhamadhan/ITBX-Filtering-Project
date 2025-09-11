# Script Penambah Nomor Aktivitas

Script ini digunakan untuk menambahkan nomor urut pada setiap aktivitas dalam file JSON RDTR dan BSB.

## Cara Kerja

Script `add-activity-numbers.js` akan:

1. Membaca file JSON dari `app/data/rdtr-data.json` dan `app/data/bsb-data.json`
2. Menambahkan properti `activityNumber` dengan format `XXX-YYY` di mana:
   - `XXX` adalah nomor urut aktivitas (001, 002, dst)
   - `YYY` adalah total jumlah aktivitas (1801)
3. Menyimpan hasil ke file baru dengan suffix `-numbered`

## Cara Penggunaan

```bash
node script/add-activity-numbers.js
```

Hasil akan disimpan di:
- `app/data/rdtr-data-numbered.json`
- `app/data/bsb-data-numbered.json`

## Contoh Output

```json
{
  "activities": [
    {
      "activity": "Pertanian Jagung",
      "activityNumber": "001-1801",
      "zones": {
        // ... data zona ...
      }
    },
    // ... aktivitas lainnya ...
  ]
}
```