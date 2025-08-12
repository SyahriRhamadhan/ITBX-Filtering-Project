import React, { useState, useMemo } from 'react';
import intensitasData from '../data/intensitas-data-merged.json';

interface IntensitasItem {
  Zona: string;
  SubZona: string;
  Jenis: string | null;
  'KDB Maks (%)': number | null;
  'KDH Min (%)': number | null;
  'KLB Maks': number | null;
  'KTB Maks (%)': number | null;
  'Luas Kavling Min (m2)': number | null;
  'Tinggi Bangunan Maks. (m) - Kolektor': number | null;
  'Tinggi Bangunan Maks. (m) - Lokal': number | null;
  'Lantai Bangunan Maks. - Kolektor': number | null;
  'Lantai Bangunan Maks. - Lokal': number | null;
  'Garis Sempadan Bangunan Min. (m) - Kolektor': number | null;
  'Garis Sempadan Bangunan Min. (m) - Lokal': number | null;
  'Jarak Bebas Samping Min. (m)': number | null;
  'Jarak Bebas Belakang Min. (m)': number | null;
  'Tampilan Bangunan': string | null;
  'Keterangan': string | null;
}

interface IntensitasData {
  data: IntensitasItem[];
  summary: {
    totalRows: number;
    zonaCount: number;
    subZonaCount: number;
    jenisKhususCount: number;
  };
  groupedByZona: Record<string, IntensitasItem[]>;
  filters: {
    zonaList: string[];
    subZonaList: string[];
    jenisKhususList: string[];
  };
  headers: string[];
}

const IntensitasFilter: React.FC = () => {
  const [selectedZona, setSelectedZona] = useState<string>('');
  const [selectedSubZona, setSelectedSubZona] = useState<string>('');
  const [selectedJenis, setSelectedJenis] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Zona');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const data = intensitasData as IntensitasData;

  const filteredData = useMemo(() => {
    let filtered = data.data.filter(item => {
      const matchesZona = !selectedZona || item.Zona === selectedZona;
      const matchesSubZona = !selectedSubZona || item.SubZona === selectedSubZona;
      const matchesJenis = !selectedJenis || item.Jenis === selectedJenis;
      const matchesSearch = !searchTerm || 
        item.Zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.SubZona.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Jenis && item.Jenis.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesZona && matchesSubZona && matchesJenis && matchesSearch;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof IntensitasItem];
      let bValue = b[sortBy as keyof IntensitasItem];
      
      if (aValue === null) aValue = '';
      if (bValue === null) bValue = '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [selectedZona, selectedSubZona, selectedJenis, searchTerm, sortBy, sortOrder]);

  const clearFilters = () => {
    setSelectedZona('');
    setSelectedSubZona('');
    setSelectedJenis('');
    setSearchTerm('');
  };

  const exportToCSV = () => {
    const headers = data.headers.join(',');
    const rows = filteredData.map(item => 
      data.headers.map(header => {
        const value = item[header as keyof IntensitasItem];
        return value === null ? '' : value;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intensitas-filtered.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCopyText = () => {
    if (filteredData.length === 0) return 'Tidak ada data yang tersedia.';

    // Group data by jenis for better formatting
    const groupedData: { [key: string]: IntensitasItem[] } = {};
    filteredData.forEach(item => {
      const key = item.Jenis || 'Umum';
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(item);
    });

    let result = '';

    // KDB (Koefisien Dasar Bangunan)
    result += 'Koefisien Dasar Bangunan (%)\n';
    filteredData.forEach(item => {
      const kdb = item['KDB Maks (%)'] !== null ? `${item['KDB Maks (%)']}` : '-';
      result += `${item.Jenis || item.SubZona}: ${kdb}\n`;
    });
    result += '\n';

    // KLB (Koefisien Lantai Bangunan)
    result += 'Koefisien Lantai Bangunan\n';
    filteredData.forEach(item => {
      const klb = item['KLB Maks'] !== null ? `${item['KLB Maks']}` : '-';
      result += `${item.Jenis || item.SubZona}: ${klb}\n`;
    });
    result += '\n';

    // KDH (Koefisien Dasar Hijau)
    result += 'Koefisien Dasar Hijau (%)\n';
    filteredData.forEach(item => {
      const kdh = item['KDH Min (%)'] !== null ? `${item['KDH Min (%)']}` : '-';
      result += `${item.Jenis || item.SubZona}: ${kdh}\n`;
    });
    result += '\n';

    // Luas Kaveling
    result += 'Luas Kaveling\n';
    const luasKavling = filteredData.some(item => item['Luas Kavling Min (m2)'] !== null) 
      ? filteredData.map(item => item['Luas Kavling Min (m2)'] || '-').join(', ')
      : '-';
    result += `Minimum: ${luasKavling}\n`;
    result += '\n';

    // KTB (Koefisien Tapak Basement)
    result += 'Koefisien Wilayah Terbangun\n';
    const ktb = filteredData.some(item => item['KTB Maks (%)'] !== null)
      ? filteredData.map(item => item['KTB Maks (%)'] ? `${item['KTB Maks (%)']}%` : '-').join(', ')
      : '-';
    result += `Maksimum: ${ktb}\n`;
    result += '\n';

    // Jarak Bebas Samping (JBS)
    result += 'Jarak Bebas Samping (JBS)\n';
    const jbs = filteredData.some(item => item['Jarak Bebas Samping Min. (m)'] !== null)
      ? filteredData.map(item => item['Jarak Bebas Samping Min. (m)'] ? `${item['Jarak Bebas Samping Min. (m)']} m` : '-').join(', ')
      : '-';
    result += `Minimum: ${jbs}\n`;
    result += '\n';

    // Jarak Bebas Belakang (JBB)
    result += 'Jarak Bebas Belakang (JBB)\n';
    const jbb = filteredData.some(item => item['Jarak Bebas Belakang Min. (m)'] !== null)
      ? filteredData.map(item => item['Jarak Bebas Belakang Min. (m)'] ? `${item['Jarak Bebas Belakang Min. (m)']} m` : '-').join(', ')
      : '-';
    result += `Minimum: ${jbb}\n`;
    result += '\n';

    // Ketinggian Bangunan
    result += 'Ketinggian Bangunan\n';
    const tinggiKolektor = filteredData.some(item => item['Tinggi Bangunan Maks. (m) - Kolektor'] !== null)
      ? filteredData.map(item => item['Tinggi Bangunan Maks. (m) - Kolektor'] ? `${item['Tinggi Bangunan Maks. (m) - Kolektor']} m` : '-').join(', ')
      : '-';
    const tinggiLokal = filteredData.some(item => item['Tinggi Bangunan Maks. (m) - Lokal'] !== null)
      ? filteredData.map(item => item['Tinggi Bangunan Maks. (m) - Lokal'] ? `${item['Tinggi Bangunan Maks. (m) - Lokal']} m` : '-').join(', ')
      : '-';
    result += `Maksimum Kolektor: ${tinggiKolektor}\n`;
    result += `Maksimum Lokal: ${tinggiLokal}\n`;
    result += '\n';

    // Lantai Bangunan
    result += 'Lantai Bangunan\n';
    const lantaiKolektor = filteredData.some(item => item['Lantai Bangunan Maks. - Kolektor'] !== null)
      ? filteredData.map(item => item['Lantai Bangunan Maks. - Kolektor'] || '-').join(', ')
      : '-';
    const lantaiLokal = filteredData.some(item => item['Lantai Bangunan Maks. - Lokal'] !== null)
      ? filteredData.map(item => item['Lantai Bangunan Maks. - Lokal'] || '-').join(', ')
      : '-';
    result += `Maksimum Kolektor: ${lantaiKolektor}\n`;
    result += `Maksimum Lokal: ${lantaiLokal}\n`;
    result += '\n';

    // Garis Sempadan Bangunan
    result += 'Garis Sempadan Bangunan\n';
    const gsbKolektor = filteredData.some(item => item['Garis Sempadan Bangunan Min. (m) - Kolektor'] !== null)
      ? filteredData.map(item => item['Garis Sempadan Bangunan Min. (m) - Kolektor'] ? `${item['Garis Sempadan Bangunan Min. (m) - Kolektor']} m` : '-').join(', ')
      : '-';
    const gsbLokal = filteredData.some(item => item['Garis Sempadan Bangunan Min. (m) - Lokal'] !== null)
      ? filteredData.map(item => item['Garis Sempadan Bangunan Min. (m) - Lokal'] ? `${item['Garis Sempadan Bangunan Min. (m) - Lokal']} m` : '-').join(', ')
      : '-';
    result += `Fungsi Jalan Kolektor: ${gsbKolektor}\n`;
    result += `Fungsi Jalan Lokal: ${gsbLokal}\n`;
    result += '\n';

    // Tampilan Bangunan
    const tampilanBangunan = filteredData.some(item => item['Tampilan Bangunan'])
      ? filteredData.map(item => item['Tampilan Bangunan'] || '-').join(', ')
      : '-';
    if (tampilanBangunan !== '-') {
      result += 'Tampilan Bangunan\n';
      result += `${tampilanBangunan}\n`;
      result += '\n';
    }

    // Keterangan
    const keterangan = filteredData.some(item => item['Keterangan'])
      ? filteredData.map(item => item['Keterangan'] || '-').join(', ')
      : '-';
    if (keterangan !== '-') {
      result += 'Keterangan\n';
      result += `${keterangan}\n`;
    }

    return result;
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = generateCopyText();
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Filter Ketentuan Intensitas Pemanfaatan Ruang
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Total: {data.summary.totalRows} data | Ditampilkan: {filteredData.length} data
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pencarian
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari zona, subzona, atau jenis..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Zona Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zona
            </label>
            <select
              value={selectedZona}
              onChange={(e) => setSelectedZona(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Semua Zona</option>
              {data.filters.zonaList.map(zona => (
                <option key={zona} value={zona}>{zona}</option>
              ))}
            </select>
          </div>

          {/* SubZona Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sub Zona
            </label>
            <select
              value={selectedSubZona}
              onChange={(e) => setSelectedSubZona(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Semua Sub Zona</option>
              {data.filters.subZonaList.map(subZona => (
                <option key={subZona} value={subZona}>{subZona}</option>
              ))}
            </select>
          </div>

          {/* Jenis Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jenis Khusus
            </label>
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Semua Jenis</option>
              {data.filters.jenisKhususList.map(jenis => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort and Actions */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Urutkan:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {data.headers.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Reset Filter
          </button>
          
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ZONA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SUBZONA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">JENIS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">KDB MAKS (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">KDH MIN (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">KLB MAKS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">KTB MAKS (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">LUAS KAVLING MIN (m2)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TINGGI BGN KOLEKTOR (m)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TINGGI BGN LOKAL (m)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">LANTAI BGN KOLEKTOR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">LANTAI BGN LOKAL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GSB KOLEKTOR (m)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GSB LOKAL (m)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">JARAK SAMPING (m)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">JARAK BELAKANG (m)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TAMPILAN BANGUNAN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">KETERANGAN</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.Zona}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.SubZona}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.Jenis || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['KDB Maks (%)'] !== null ? `${item['KDB Maks (%)']}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['KDH Min (%)'] !== null ? `${item['KDH Min (%)']}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['KLB Maks'] !== null ? item['KLB Maks'] : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['KTB Maks (%)'] !== null ? `${item['KTB Maks (%)']}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Luas Kavling Min (m2)'] !== null ? `${item['Luas Kavling Min (m2)']} m²` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Tinggi Bangunan Maks. (m) - Kolektor'] !== null ? `${item['Tinggi Bangunan Maks. (m) - Kolektor']} m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Tinggi Bangunan Maks. (m) - Lokal'] !== null ? `${item['Tinggi Bangunan Maks. (m) - Lokal']} m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Lantai Bangunan Maks. - Kolektor'] !== null ? item['Lantai Bangunan Maks. - Kolektor'] : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Lantai Bangunan Maks. - Lokal'] !== null ? item['Lantai Bangunan Maks. - Lokal'] : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Garis Sempadan Bangunan Min. (m) - Kolektor'] !== null ? `${item['Garis Sempadan Bangunan Min. (m) - Kolektor']} m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Garis Sempadan Bangunan Min. (m) - Lokal'] !== null ? `${item['Garis Sempadan Bangunan Min. (m) - Lokal']} m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Jarak Bebas Samping Min. (m)'] !== null ? `${item['Jarak Bebas Samping Min. (m)']} m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Jarak Bebas Belakang Min. (m)'] !== null ? `${item['Jarak Bebas Belakang Min. (m)']} m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Tampilan Bangunan'] || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Keterangan'] || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Tidak ada data yang sesuai dengan filter yang dipilih.
          </div>
        )}
      </div>

      {/* Preview Section */}
      {filteredData.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preview Data untuk Copy
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  {showPreview ? 'Sembunyikan' : 'Tampilkan'} Preview
                </button>
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    copySuccess 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copySuccess ? '✓ Tersalin!' : 'Copy ke Clipboard'}
                </button>
              </div>
            </div>
          </div>
          
          {showPreview && (
            <div className="p-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 border">
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                  {generateCopyText()}
                </pre>
              </div>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <p>💡 <strong>Tips:</strong> Klik tombol "Copy ke Clipboard" untuk menyalin format di atas ke clipboard Anda.</p>
                <p>📋 Data akan disalin dalam format yang mudah dibaca dan dapat langsung digunakan dalam dokumen.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntensitasFilter;