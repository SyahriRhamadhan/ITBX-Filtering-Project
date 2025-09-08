import React, { useState, useMemo } from 'react';
import intensitasDataTrikora from '../data/intensitas-data-merged.json';
import intensitasDataBsb from '../data/intensitas-data-merged-bsb.json';

interface IntensitasItem {
  Zona: string;
  SubZona: string;
  Jenis: string | null;
  'KDB Maks (%)': number | null;
  'KDH Min (%)': number | null;
  'KLB Maks': number | null;
  'KTB Maks (%)': number | null;
  'Luas Kavling Min (m2)': number | null;
  'Tinggi Bangunan Maks. (m) - Arteri'?: number | null;
  'Tinggi Bangunan Maks. (m) - Kolektor': number | null;
  'Tinggi Bangunan Maks. (m) - Lokal': number | null;
  'Lantai Bangunan Maks. - Arteri'?: string | null;
  'Lantai Bangunan Maks. - Kolektor': number | null;
  'Lantai Bangunan Maks. - Lokal': number | null;
  'Garis Sempadan Bangunan Min. (m) - Arteri'?: number | null;
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

interface IntensitasFilterProps {
  dataSource?: 'trikora' | 'bsb';
}

const IntensitasFilter: React.FC<IntensitasFilterProps> = ({ dataSource = 'trikora' }) => {
  const [selectedZona, setSelectedZona] = useState<string>('');
  const [selectedSubZona, setSelectedSubZona] = useState<string>('');
  const [selectedJenis, setSelectedJenis] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Zona');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const data = useMemo(() => {
    return dataSource === 'bsb' 
      ? intensitasDataBsb as IntensitasData
      : intensitasDataTrikora as IntensitasData;
  }, [dataSource]);

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

    let result = '';

    // Helper function to format values
    const formatValue = (value: number | null) => value !== null ? value.toString() : '-';

    // Check if data has persil (location-specific data)
    const hasPersil = filteredData.some(item => 
      item.Jenis && 
      item.Jenis !== '-' && 
      item.Jenis.trim() !== '' && (
        item.Jenis.toLowerCase().includes('persil disebelah barat') ||
        item.Jenis.toLowerCase().includes('persil disebelah timur')
      )
    );

    // Group data by location if persil exists
    let westSideData = null;
    let eastSideData = null;
    
    if (hasPersil) {
      westSideData = filteredData.find(item => 
        item.Jenis && 
        item.Jenis !== '-' && 
        item.Jenis.trim() !== '' && 
        item.Jenis.toLowerCase().includes('persil disebelah barat')
      ) || null;
      eastSideData = filteredData.find(item => 
        item.Jenis && 
        item.Jenis !== '-' && 
        item.Jenis.trim() !== '' && 
        item.Jenis.toLowerCase().includes('persil disebelah timur')
      ) || null;
    } else {
      // Use first item for non-persil data
      westSideData = filteredData[0] || null;
      eastSideData = filteredData[0] || null;
    }

    // Check if there are multiple Jenis types (excluding persil and empty/null values)
    const validJenisTypes = filteredData
      .map(item => item.Jenis)
      .filter(jenis => 
        jenis && 
        jenis !== '-' && 
        jenis.trim() !== '' && 
        !jenis.toLowerCase().includes('persil disebelah')
      )
      .filter((jenis, index, arr) => arr.indexOf(jenis) === index); // Remove duplicates

    const hasMultipleJenis = validJenisTypes.length > 1;

    // KDB (Koefisien Dasar Bangunan)
    result += 'Koefisien Dasar Bangunan (%)\n';
    if (hasMultipleJenis) {
      validJenisTypes.forEach((jenis, index) => {
        const jenisData = filteredData.find(item => item.Jenis === jenis);
        const kdbValue = jenisData && jenisData['KDB Maks (%)'] !== null ? jenisData['KDB Maks (%)'] : '-';
        const letter = String.fromCharCode(97 + index); // a, b, c, etc.
        const separator = index === validJenisTypes.length - 1 ? '.' : '; dan';
        result += `${letter}.: ${jenis} minimum ${kdbValue !== '-' ? kdbValue : '-'}${separator}\n`;
      });
    } else {
      const kdbValue = filteredData.some(item => item['KDB Maks (%)'] !== null)
        ? filteredData.map(item => item['KDB Maks (%)'] || '-').find(val => val !== '-')
        : '-';
      result += `Maksimum: ${kdbValue !== '-' ? kdbValue + '%' : '-'}\n`;
    }
    result += '\n';

    // KLB (Koefisien Lantai Bangunan)
    result += 'Koefisien Lantai Bangunan\n';
    if (hasMultipleJenis) {
      validJenisTypes.forEach((jenis, index) => {
        const jenisData = filteredData.find(item => item.Jenis === jenis);
        const klbValue = jenisData && jenisData['KLB Maks'] !== null ? jenisData['KLB Maks'].toString().replace('.', ',') : '-';
        const letter = String.fromCharCode(97 + index); // a, b, c, etc.
        const separator = index === validJenisTypes.length - 1 ? '.' : '; dan';
        result += `${letter}.: ${jenis} = ${klbValue !== '-' ? klbValue : '-'}${separator}\n`;
      });
    } else {
      const klbMaksValue = filteredData.some(item => item['KLB Maks'] !== null)
        ? filteredData.map(item => item['KLB Maks'] || '-').find(val => val !== '-')
        : '-';
      result += `KLB Maksimum: ${klbMaksValue !== '-' && klbMaksValue !== undefined ? klbMaksValue.toString().replace('.', ',') : '-'}\n`;
      result += `KLB Minimum: -\n`;
    }
    result += '\n';

    // KDH (Koefisien Dasar Hijau)
    result += 'Koefisien Dasar Hijau (%)\n';
    if (hasMultipleJenis) {
      validJenisTypes.forEach((jenis, index) => {
        const jenisData = filteredData.find(item => item.Jenis === jenis);
        const kdhValue = jenisData && jenisData['KDH Min (%)'] !== null ? jenisData['KDH Min (%)'] : '-';
        const letter = String.fromCharCode(97 + index); // a, b, c, etc.
        const separator = index === validJenisTypes.length - 1 ? '.' : '; dan';
        result += `${letter}.: ${jenis} minimum ${kdhValue !== '-' ? kdhValue : '-'}${separator}\n`;
      });
    } else {
      const kdhValue = filteredData.some(item => item['KDH Min (%)'] !== null)
        ? filteredData.map(item => item['KDH Min (%)'] || '-').find(val => val !== '-')
        : '-';
      result += `Minimum: ${kdhValue}\n`;
    }
    result += '\n';

    // Luas Kaveling
    result += 'Luas Kaveling\n';
    const luasKavling = filteredData.some(item => item['Luas Kavling Min (m2)'] !== null) 
      ? filteredData.map(item => item['Luas Kavling Min (m2)'] || '-').join(', ')
      : '-';
    result += `Minimum: ${luasKavling}\n`;
    result += '\n';

    // Ketinggian Bangunan - Conditional format based on persil and multiple jenis
    result += 'Ketinggian Bangunan\n';
    
    if (hasMultipleJenis && !hasPersil) {
      // Grouped format for multiple jenis
      validJenisTypes.forEach((jenis, jenisIndex) => {
        const jenisData = filteredData.find(item => item.Jenis === jenis);
        result += `${jenis}:\n`;
        
        let roadIndex = 0;
        if (dataSource === 'bsb') {
          const tinggiArteri = jenisData && jenisData['Tinggi Bangunan Maks. (m) - Arteri'] !== null 
            ? jenisData['Tinggi Bangunan Maks. (m) - Arteri'] 
            : '-';
          const letter = String.fromCharCode(97 + roadIndex);
          result += `    ${letter}.: Jalan Arteri = ${tinggiArteri !== '-' ? tinggiArteri : '-'};\n`;
          roadIndex++;
        }
        
        const tinggiKolektor = jenisData && jenisData['Tinggi Bangunan Maks. (m) - Kolektor'] !== null 
          ? jenisData['Tinggi Bangunan Maks. (m) - Kolektor'] 
          : '-';
        const kolektorLetter = String.fromCharCode(97 + roadIndex);
        result += `    ${kolektorLetter}.: Jalan Kolektor = ${tinggiKolektor !== '-' ? tinggiKolektor : '-'}; dan\n`;
        roadIndex++;
        
        const tinggiLokal = jenisData && jenisData['Tinggi Bangunan Maks. (m) - Lokal'] !== null 
          ? jenisData['Tinggi Bangunan Maks. (m) - Lokal'] 
          : '-';
        const lokalLetter = String.fromCharCode(97 + roadIndex);
        result += `    ${lokalLetter}.: Jalan Lokal = ${tinggiLokal !== '-' ? tinggiLokal : '-'}.\n`;
        
        if (jenisIndex < validJenisTypes.length - 1) {
          result += ' \n'; // Add space between jenis groups
        }
      });
    } else if (hasPersil) {
      // Format with persil
      result += 'Persil disebelah barat jalan Nasional:\n';
      if (dataSource === 'bsb') {
        const tinggiArteriWest = westSideData && westSideData['Tinggi Bangunan Maks. (m) - Arteri'] !== null 
          ? westSideData['Tinggi Bangunan Maks. (m) - Arteri'] 
          : '-';
        result += `    a.: Jalan Arteri = ${tinggiArteriWest};\n`;
      }
      const tinggiKolektorWest = westSideData && westSideData['Tinggi Bangunan Maks. (m) - Kolektor'] !== null 
        ? westSideData['Tinggi Bangunan Maks. (m) - Kolektor'] 
        : '-';
      result += `    ${dataSource === 'bsb' ? 'b' : 'a'}.: Jalan Kolektor = ${tinggiKolektorWest}; dan\n`;
      const tinggiLokalWest = westSideData && westSideData['Tinggi Bangunan Maks. (m) - Lokal'] !== null 
        ? westSideData['Tinggi Bangunan Maks. (m) - Lokal'] 
        : '-';
      result += `    ${dataSource === 'bsb' ? 'c' : 'b'}.: Jalan Lokal = ${tinggiLokalWest}.\n`;
      result += 'Persil disebelah timur jalan Nasional:\n';
      if (dataSource === 'bsb') {
        const tinggiArteriEast = eastSideData && eastSideData['Tinggi Bangunan Maks. (m) - Arteri'] !== null 
          ? eastSideData['Tinggi Bangunan Maks. (m) - Arteri'] 
          : '-';
        result += `    a.: Jalan Arteri = ${tinggiArteriEast};\n`;
      }
      const tinggiKolektorEast = eastSideData && eastSideData['Tinggi Bangunan Maks. (m) - Kolektor'] !== null 
        ? eastSideData['Tinggi Bangunan Maks. (m) - Kolektor'] 
        : '-';
      result += `    ${dataSource === 'bsb' ? 'b' : 'a'}.: Jalan Kolektor = ${tinggiKolektorEast}; dan\n`;
      const tinggiLokalEast = eastSideData && eastSideData['Tinggi Bangunan Maks. (m) - Lokal'] !== null 
        ? eastSideData['Tinggi Bangunan Maks. (m) - Lokal'] 
        : '-';
      result += `    ${dataSource === 'bsb' ? 'c' : 'b'}.: Jalan Lokal = ${tinggiLokalEast}.\n`;
    } else {
      // Simple format without persil
      if (dataSource === 'bsb') {
        const tinggiArteri = westSideData && westSideData['Tinggi Bangunan Maks. (m) - Arteri'] !== null 
          ? westSideData['Tinggi Bangunan Maks. (m) - Arteri'] 
          : '-';
        result += `Maksimum Arteri: ${tinggiArteri !== '-' ? tinggiArteri + ' m' : '-'}\n`;
      }
      const tinggiKolektor = westSideData && westSideData['Tinggi Bangunan Maks. (m) - Kolektor'] !== null 
        ? westSideData['Tinggi Bangunan Maks. (m) - Kolektor'] 
        : '-';
      const tinggiLokal = westSideData && westSideData['Tinggi Bangunan Maks. (m) - Lokal'] !== null 
        ? westSideData['Tinggi Bangunan Maks. (m) - Lokal'] 
        : '-';
      result += `Maksimum Kolektor: ${tinggiKolektor !== '-' ? tinggiKolektor + ' m' : '-'}\n`;
      result += `Maksimum Lokal: ${tinggiLokal !== '-' ? tinggiLokal + ' m' : '-'}\n`;
    }
    result += '\n';

    // Koefisien Tapak Basement
    result += 'Koefisien Tapak Basement\n';
    const ktb = filteredData.some(item => item['KTB Maks (%)'] !== null)
      ? filteredData.map(item => item['KTB Maks (%)'] ? `${item['KTB Maks (%)']}%` : '-').join(', ')
      : '-';
    result += `${ktb}\n`;
    result += '\n';

    // Garis Sempadan Bangunan - Conditional format based on persil and multiple jenis
    result += 'Garis Sempadan Bangunan\n';
    
    if (hasMultipleJenis && !hasPersil) {
      // Grouped format for multiple jenis
      validJenisTypes.forEach((jenis, jenisIndex) => {
        const jenisData = filteredData.find(item => item.Jenis === jenis);
        result += `${jenis}:\n`;
        
        let roadIndex = 0;
        if (dataSource === 'bsb') {
          const gsbArteri = jenisData && jenisData['Garis Sempadan Bangunan Min. (m) - Arteri'] !== null 
            ? jenisData['Garis Sempadan Bangunan Min. (m) - Arteri'] 
            : '-';
          const letter = String.fromCharCode(97 + roadIndex);
          result += `    ${letter}.: Jalan Arteri = ${gsbArteri !== '-' ? gsbArteri : '-'};\n`;
          roadIndex++;
        }
        
        const gsbKolektor = jenisData && jenisData['Garis Sempadan Bangunan Min. (m) - Kolektor'] !== null 
          ? jenisData['Garis Sempadan Bangunan Min. (m) - Kolektor'] 
          : '-';
        const kolektorLetter = String.fromCharCode(97 + roadIndex);
        result += `    ${kolektorLetter}.: Jalan Kolektor = ${gsbKolektor !== '-' ? gsbKolektor : '-'}; dan\n`;
        roadIndex++;
        
        const gsbLokal = jenisData && jenisData['Garis Sempadan Bangunan Min. (m) - Lokal'] !== null 
          ? jenisData['Garis Sempadan Bangunan Min. (m) - Lokal'] 
          : '-';
        const lokalLetter = String.fromCharCode(97 + roadIndex);
        result += `    ${lokalLetter}.: Jalan Lokal = ${gsbLokal !== '-' ? gsbLokal : '-'}.\n`;
        
        if (jenisIndex < validJenisTypes.length - 1) {
          result += ' \n'; // Add space between jenis groups
        }
      });
    } else if (hasPersil) {
      // Format with persil
      result += 'Persil disebelah barat jalan Nasional:\n';
      if (dataSource === 'bsb') {
        const gsbArteriWest = westSideData && westSideData['Garis Sempadan Bangunan Min. (m) - Arteri'] !== null 
          ? westSideData['Garis Sempadan Bangunan Min. (m) - Arteri'] 
          : '-';
        result += `    a.: Jalan Arteri = ${gsbArteriWest};\n`;
      }
      const gsbKolektorWest = westSideData && westSideData['Garis Sempadan Bangunan Min. (m) - Kolektor'] !== null 
        ? westSideData['Garis Sempadan Bangunan Min. (m) - Kolektor'] 
        : '-';
      result += `    ${dataSource === 'bsb' ? 'b' : 'a'}.: Jalan Kolektor = ${gsbKolektorWest}; dan\n`;
      const gsbLokalWest = westSideData && westSideData['Garis Sempadan Bangunan Min. (m) - Lokal'] !== null 
        ? westSideData['Garis Sempadan Bangunan Min. (m) - Lokal'] 
        : '-';
      result += `    ${dataSource === 'bsb' ? 'c' : 'b'}.: Jalan Lokal = ${gsbLokalWest}.\n`;
      result += 'Persil disebelah timur jalan Nasional:\n';
      if (dataSource === 'bsb') {
        const gsbArteriEast = eastSideData && eastSideData['Garis Sempadan Bangunan Min. (m) - Arteri'] !== null 
          ? eastSideData['Garis Sempadan Bangunan Min. (m) - Arteri'] 
          : '-';
        result += `    a.: Jalan Arteri = ${gsbArteriEast};\n`;
      }
      const gsbKolektorEast = eastSideData && eastSideData['Garis Sempadan Bangunan Min. (m) - Kolektor'] !== null 
        ? eastSideData['Garis Sempadan Bangunan Min. (m) - Kolektor'] 
        : '-';
      result += `    ${dataSource === 'bsb' ? 'b' : 'a'}.: Jalan Kolektor = ${gsbKolektorEast}; dan\n`;
      const gsbLokalEast = eastSideData && eastSideData['Garis Sempadan Bangunan Min. (m) - Lokal'] !== null 
        ? eastSideData['Garis Sempadan Bangunan Min. (m) - Lokal'] 
        : '-';
      result += `    ${dataSource === 'bsb' ? 'c' : 'b'}.: Jalan Lokal = ${gsbLokalEast}.\n`;
    } else {
      // Simple format without persil
      if (dataSource === 'bsb') {
        const gsbArteri = westSideData && westSideData['Garis Sempadan Bangunan Min. (m) - Arteri'] !== null 
          ? westSideData['Garis Sempadan Bangunan Min. (m) - Arteri'] 
          : '-';
        result += `Minimum Arteri: ${gsbArteri !== '-' ? gsbArteri + ' m' : '-'}\n`;
      }
      const gsbKolektor = westSideData && westSideData['Garis Sempadan Bangunan Min. (m) - Kolektor'] !== null 
        ? westSideData['Garis Sempadan Bangunan Min. (m) - Kolektor'] 
        : '-';
      const gsbLokal = westSideData && westSideData['Garis Sempadan Bangunan Min. (m) - Lokal'] !== null 
        ? westSideData['Garis Sempadan Bangunan Min. (m) - Lokal'] 
        : '-';
      result += `Minimum Kolektor: ${gsbKolektor !== '-' ? gsbKolektor + ' m' : '-'}\n`;
      result += `Minimum Lokal: ${gsbLokal !== '-' ? gsbLokal + ' m' : '-'}\n`;
    }
    result += '\n';

    // Jarak Bebas Samping (JBS)
    result += 'Jarak Bebas Samping (JBS)\n';
    if (hasMultipleJenis) {
      validJenisTypes.forEach((jenis, index) => {
        const jenisData = filteredData.find(item => item.Jenis === jenis);
        const jbsValue = jenisData && jenisData['Jarak Bebas Samping Min. (m)'] !== null 
          ? jenisData['Jarak Bebas Samping Min. (m)'] 
          : '-';
        const letter = String.fromCharCode(97 + index);
        const separator = index === validJenisTypes.length - 1 ? '.' : '; dan';
        result += `${letter}.: ${jenis} minimum ${jbsValue !== '-' ? jbsValue + ' m' : '-'}${separator}\n`;
      });
    } else {
      const jbsValue = westSideData && westSideData['Jarak Bebas Samping Min. (m)'] !== null 
        ? `${westSideData['Jarak Bebas Samping Min. (m)']} m` 
        : '-';
      result += `Minimum: ${jbsValue}\n`;
    }
    result += '\n';

    // Jarak Bebas Belakang (JBB)
    result += 'Jarak Bebas Belakang (JBB)\n';
    if (hasMultipleJenis) {
      validJenisTypes.forEach((jenis, index) => {
        const jenisData = filteredData.find(item => item.Jenis === jenis);
        const jbbValue = jenisData && jenisData['Jarak Bebas Belakang Min. (m)'] !== null 
          ? jenisData['Jarak Bebas Belakang Min. (m)'] 
          : '-';
        const letter = String.fromCharCode(97 + index);
        const separator = index === validJenisTypes.length - 1 ? '.' : '; dan';
        result += `${letter}.: ${jenis} minimum ${jbbValue !== '-' ? jbbValue + ' m' : '-'}${separator}\n`;
      });
    } else {
      const jbbValue = westSideData && westSideData['Jarak Bebas Belakang Min. (m)'] !== null 
        ? `${westSideData['Jarak Bebas Belakang Min. (m)']} m` 
        : '-';
      result += `Minimum: ${jbbValue}\n`;
    }
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

    // Tampilan Bangunan
    const tampilanBangunanData = filteredData.filter(item => item['Tampilan Bangunan'] && item['Tampilan Bangunan'] !== '-');
    if (tampilanBangunanData.length > 0) {
      result += 'Tampilan Bangunan\n';
      if (hasMultipleJenis) {
        // Get unique tampilan bangunan values for each jenis
        const jenisWithTampilan = validJenisTypes.filter(jenis => {
          const jenisData = filteredData.find(item => item.Jenis === jenis);
          return jenisData && jenisData['Tampilan Bangunan'] && jenisData['Tampilan Bangunan'] !== '-';
        });
        
        jenisWithTampilan.forEach(jenis => {
          const jenisData = filteredData.find(item => item.Jenis === jenis);
          if (jenisData && jenisData['Tampilan Bangunan']) {
            result += `${jenis}:\n`;
            result += `${jenisData['Tampilan Bangunan']}\n`;
          }
        });
      } else {
        const tampilanBangunan = filteredData.some(item => item['Tampilan Bangunan'])
          ? filteredData.map(item => item['Tampilan Bangunan'] || '-').join(', ')
          : '-';
        result += `${tampilanBangunan}\n`;
      }
      result += '\n';
    }

    // Keterangan
    const keteranganData = filteredData.filter(item => item['Keterangan'] && item['Keterangan'] !== '-');
    if (keteranganData.length > 0) {
      result += 'Keterangan\n';
      if (hasMultipleJenis) {
        // Get unique keterangan values for each jenis
        const jenisWithKeterangan = validJenisTypes.filter(jenis => {
          const jenisData = filteredData.find(item => item.Jenis === jenis);
          return jenisData && jenisData['Keterangan'] && jenisData['Keterangan'] !== '-';
        });
        
        jenisWithKeterangan.forEach(jenis => {
          const jenisData = filteredData.find(item => item.Jenis === jenis);
          if (jenisData && jenisData['Keterangan']) {
            result += `${jenis}:\n`;
            result += `${jenisData['Keterangan']}\n`;
          }
        });
      } else {
        const keterangan = filteredData.some(item => item['Keterangan'])
          ? filteredData.map(item => item['Keterangan'] || '-').join(', ')
          : '-';
        result += `${keterangan}\n`;
      }
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
          Filter Ketentuan Intensitas Pemanfaatan Ruang - {dataSource === 'bsb' ? 'BSB' : 'Trikora'}
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
                {dataSource === 'bsb' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TINGGI BGN ARTERI (m)</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TINGGI BGN KOLEKTOR (m)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TINGGI BGN LOKAL (m)</th>
                {dataSource === 'bsb' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">LANTAI BGN ARTERI</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">LANTAI BGN KOLEKTOR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">LANTAI BGN LOKAL</th>
                {dataSource === 'bsb' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GSB ARTERI (m)</th>
                )}
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
                  {dataSource === 'bsb' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item['Tinggi Bangunan Maks. (m) - Arteri'] !== null ? `${item['Tinggi Bangunan Maks. (m) - Arteri']} m` : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Tinggi Bangunan Maks. (m) - Kolektor'] !== null ? `${item['Tinggi Bangunan Maks. (m) - Kolektor']} m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Tinggi Bangunan Maks. (m) - Lokal'] !== null ? `${item['Tinggi Bangunan Maks. (m) - Lokal']} m` : '-'}
                  </td>
                  {dataSource === 'bsb' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item['Lantai Bangunan Maks. - Arteri'] !== null ? item['Lantai Bangunan Maks. - Arteri'] : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Lantai Bangunan Maks. - Kolektor'] !== null ? item['Lantai Bangunan Maks. - Kolektor'] : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Lantai Bangunan Maks. - Lokal'] !== null ? item['Lantai Bangunan Maks. - Lokal'] : '-'}
                  </td>
                  {dataSource === 'bsb' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item['Garis Sempadan Bangunan Min. (m) - Arteri'] !== null ? `${item['Garis Sempadan Bangunan Min. (m) - Arteri']} m` : '-'}
                    </td>
                  )}
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