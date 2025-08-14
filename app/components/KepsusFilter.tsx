import React, { useState, useMemo } from 'react';

// Function to capitalize each word
const capitalizeWords = (text: string): string => {
  if (!text) return text;
  return text.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

interface KepsusActivity {
  activity: string;
  zones: {
    'Luas (Ha)': string;
    'Ketentuan': string;
  };
  metadata?: {
    kawasanType: string;
    kodeSWP: string;
    kodeBlok: string;
    tabel: string;
  };
}

interface KepsusData {
  activities: KepsusActivity[];
  zones: string[];
  regulations: Record<string, string>;
  metadata: {
    totalRows: number;
    headerRowIndex: number;
    dataStartIndex: number;
    processedAt: string;
    headers: string[];
  };
}

interface KepsusFilterProps {
  data: KepsusData;
}

export default function KepsusFilter({ data }: KepsusFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKawasan, setSelectedKawasan] = useState('');
  const [selectedKodeSWP, setSelectedKodeSWP] = useState('');
  const [selectedKodeBlok, setSelectedKodeBlok] = useState('');
  const [selectedSubZona, setSelectedSubZona] = useState('');
  const [selectedTabel, setSelectedTabel] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'area'>('name');
  const [showWithoutRegulations, setShowWithoutRegulations] = useState(true);

  // Get unique values for filtering
  const kawasanTypes = useMemo(() => {
    const types = new Set<string>();
    data.activities.forEach(activity => {
      if (activity.metadata?.kawasanType) {
        types.add(activity.metadata.kawasanType);
      }
    });
    return Array.from(types).sort();
  }, [data.activities]);

  const kodeSWPList = useMemo(() => {
    const codes = new Set<string>();
    data.activities.forEach(activity => {
      if (activity.metadata?.kodeSWP) {
        codes.add(activity.metadata.kodeSWP);
      }
    });
    return Array.from(codes).sort();
  }, [data.activities]);

  const kodeBlokList = useMemo(() => {
    const codes = new Set<string>();
    data.activities.forEach(activity => {
      if (activity.metadata?.kodeBlok && activity.metadata.kodeBlok.trim()) {
        codes.add(activity.metadata.kodeBlok);
      }
    });
    return Array.from(codes).sort();
  }, [data.activities]);

  const subZonaList = useMemo(() => {
    const zones = new Set<string>();
    data.activities.forEach(activity => {
      if (activity.activity) {
        zones.add(activity.activity);
      }
    });
    return Array.from(zones).sort();
  }, [data.activities]);

  const tabelList = useMemo(() => {
    const tables = new Set<string>();
    data.activities.forEach(activity => {
      if (activity.metadata?.tabel) {
        tables.add(activity.metadata.tabel);
      }
    });
    return Array.from(tables).sort();
  }, [data.activities]);

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = data.activities.filter(activity => {
      // Search filter
      const matchesSearch = activity.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.zones['Ketentuan'] && activity.zones['Ketentuan'].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.metadata?.kodeSWP && activity.metadata.kodeSWP.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.metadata?.kodeBlok && activity.metadata.kodeBlok.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.metadata?.kawasanType && activity.metadata.kawasanType.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Kawasan filter
      const matchesKawasan = !selectedKawasan || 
        (activity.metadata?.kawasanType === selectedKawasan);
      
      // Kode SWP filter
      const matchesKodeSWP = !selectedKodeSWP || 
        (activity.metadata?.kodeSWP === selectedKodeSWP);
      
      // Kode Blok filter
      const matchesKodeBlok = !selectedKodeBlok || 
        (activity.metadata?.kodeBlok === selectedKodeBlok);
      
      // Sub Zona filter
      const matchesSubZona = !selectedSubZona || 
        (activity.activity === selectedSubZona);
      
      // Tabel filter
      const matchesTabel = !selectedTabel || 
        (activity.metadata?.tabel === selectedTabel);
      
      // Regulations filter
      const hasRegulations = activity.zones['Ketentuan'] && activity.zones['Ketentuan'].trim().length > 0;
      const matchesRegulationFilter = showWithoutRegulations || hasRegulations;
      
      return matchesSearch && matchesKawasan && matchesKodeSWP && matchesKodeBlok && matchesSubZona && matchesTabel && matchesRegulationFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.activity.localeCompare(b.activity);
      } else {
        const aArea = parseFloat(a.zones['Luas (Ha)'].replace(',', '.')) || 0;
        const bArea = parseFloat(b.zones['Luas (Ha)'].replace(',', '.')) || 0;
        return bArea - aArea; // Descending order for area
      }
    });

    return filtered;
  }, [data.activities, searchTerm, selectedKawasan, selectedKodeSWP, selectedKodeBlok, selectedSubZona, selectedTabel, sortBy, showWithoutRegulations]);

  // Generate copy format function
  const generateCopyFormat = (activities: KepsusActivity[]) => {
    const groupedByTabel = new Map<string, Map<string, KepsusActivity[]>>();
    
    // Group activities by tabel first, then by kawasanType
    activities.forEach(activity => {
      const tabel = activity.metadata?.tabel || 'Tidak Diketahui';
      const kawasanType = activity.metadata?.kawasanType || 'Tidak Diketahui';
      
      if (!groupedByTabel.has(tabel)) {
        groupedByTabel.set(tabel, new Map());
      }
      
      const kawasanMap = groupedByTabel.get(tabel)!;
      if (!kawasanMap.has(kawasanType)) {
        kawasanMap.set(kawasanType, []);
      }
      
      kawasanMap.get(kawasanType)!.push(activity);
    });

    let result = '';
    
    groupedByTabel.forEach((kawasanMap, tabel) => {
      // Convert tabel name to title case format using capitalizeWords
       const formatTabelName = (name: string) => {
         let formatted = name.replace(/TABEL\s+/i, '');
         
         // Special case for aviation safety
         if (formatted.includes('KESELAMATAN OPERASI PENERBANGAN')) {
           formatted = formatted.replace('KESELAMATAN OPERASI PENERBANGAN', 'Penerbangan');
         }
         
         // Use capitalizeWords function for consistent formatting
         return capitalizeWords(formatted);
        };
      
      result += `${formatTabelName(tabel)}:\n`;
      
      kawasanMap.forEach((kawasanActivities, kawasanType) => {
        // Special handling for "Rawan Bencana Banjir dan Cuaca Ekstrem Tingkat Tinggi"
        if (kawasanType === 'Rawan Bencana Banjir dan Cuaca Ekstrem Tingkat Tinggi') {
          // First show "Rawan Bencana Banjir dan Cuaca Ekstrem Tingkat Tinggi" with all 6 points
          result += `  ${capitalizeWords(kawasanType)}:\n`;
          
          const ketentuan = kawasanActivities[0].zones['Ketentuan'];
          if (ketentuan) {
            const lines = ketentuan.split(/\r?\n/).filter(line => line.trim());
            let letterIndex = 0;
            
            lines.forEach(line => {
              const trimmedLine = line.trim();
              if (trimmedLine) {
                if (!trimmedLine.startsWith('(Sumber:')) {
                  const letter = String.fromCharCode(97 + letterIndex);
                  
                  if (trimmedLine.match(/^\d+\./)) {
                    const contentAfterNumber = trimmedLine.replace(/^\d+\.\s*/, '');
                    result += `    ${letter}.: ${contentAfterNumber}\n`;
                  } else {
                    result += `    ${letter}.: ${trimmedLine}\n`;
                  }
                  letterIndex++;
                }
              }
            });
          }
          
          result += '\n';
          
          // Then show "Rawan Bencana Cuaca Ekstrem Tingkat Tinggi" with only points 4-6
          result += `  ${capitalizeWords('Rawan Bencana Cuaca Ekstrem Tingkat Tinggi')}:\n`;
          
          if (ketentuan) {
            const lines = ketentuan.split(/\r?\n/).filter(line => line.trim());
            let letterIndex = 0;
            let pointIndex = 0;
            
            lines.forEach(line => {
              const trimmedLine = line.trim();
              if (trimmedLine) {
                if (!trimmedLine.startsWith('(Sumber:')) {
                  pointIndex++;
                  // Only show points 4, 5, 6 (structure, glass, weather monitoring)
                  if (pointIndex >= 4) {
                    const letter = String.fromCharCode(97 + letterIndex);
                    
                    if (trimmedLine.match(/^\d+\./)) {
                      const contentAfterNumber = trimmedLine.replace(/^\d+\.\s*/, '');
                      result += `    ${letter}.: ${contentAfterNumber}\n`;
                    } else {
                      result += `    ${letter}.: ${trimmedLine}\n`;
                    }
                    letterIndex++;
                  }
                }
              }
            });
          }
          
          result += '\n';
        } else {
          // Normal processing for other kawasanType
          result += `  ${capitalizeWords(kawasanType)}:\n`;
          
          const ketentuan = kawasanActivities[0].zones['Ketentuan'];
          if (ketentuan) {
            const lines = ketentuan.split(/\r?\n/).filter(line => line.trim());
            let letterIndex = 0;
            
            lines.forEach(line => {
              const trimmedLine = line.trim();
              if (trimmedLine) {
                if (!trimmedLine.startsWith('(Sumber:')) {
                  const letter = String.fromCharCode(97 + letterIndex);
                  
                  if (trimmedLine.match(/^\d+\./)) {
                    const contentAfterNumber = trimmedLine.replace(/^\d+\.\s*/, '');
                    result += `    ${letter}.: ${contentAfterNumber}\n`;
                  } else {
                    result += `    ${letter}.: ${trimmedLine}\n`;
                  }
                  letterIndex++;
                }
              }
            });
          }
          
          result += '\n';
        }
      });
    });
    
    return result.trim();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Filter Ketentuan Khusus Kawasan
        </h1>
        <p className="text-gray-600">
          Total: {filteredActivities.length} dari {data.activities.length} ketentuan khusus
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Search */}
          {/* <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pencarian
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari aktivitas, ketentuan, atau kode..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div> */}

          {/* Tabel Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tabel
            </label>
            <select
              value={selectedTabel}
              onChange={(e) => setSelectedTabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tabel</option>
              {tabelList.map(tabel => (
                <option key={tabel} value={tabel}>{capitalizeWords(tabel)}</option>
              ))}
            </select>
          </div>

          {/* Kawasan Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Kawasan
            </label>
            <select
              value={selectedKawasan}
              onChange={(e) => setSelectedKawasan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kawasan</option>
              {kawasanTypes.map(type => (
                <option key={type} value={type}>{capitalizeWords(type)}</option>
              ))}
            </select>
          </div>

          {/* Sub Zona Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Sub-Zona
            </label>
            <select
              value={selectedSubZona}
              onChange={(e) => setSelectedSubZona(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Sub-Zona</option>
              {subZonaList.map(zona => (
                <option key={zona} value={zona}>{zona}</option>
              ))}
            </select>
          </div>

          {/* Kode SWP Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode SWP
            </label>
            <select
              value={selectedKodeSWP}
              onChange={(e) => setSelectedKodeSWP(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kode SWP</option>
              {kodeSWPList.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          {/* Kode Blok Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Blok
            </label>
            <select
              value={selectedKodeBlok}
              onChange={(e) => setSelectedKodeBlok(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kode Blok</option>
              {kodeBlokList.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urutkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'area')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Nama</option>
              <option value="area">Luas Area</option>
            </select>
          </div>

          {/* Show without regulations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Ketentuan
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showWithoutRegulations}
                onChange={(e) => setShowWithoutRegulations(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Tampilkan tanpa ketentuan</span>
            </label>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedKawasan('');
                setSelectedKodeSWP('');
                setSelectedKodeBlok('');
                setSelectedSubZona('');
                setSelectedTabel('');
                setShowWithoutRegulations(true);
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Results - Table Format */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada data yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tabel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sub Kawasan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Sub-Zona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode SWP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Blok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Luas (Ha)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ketentuan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {capitalizeWords(activity.metadata?.tabel || 'TABEL KETENTUAN KHUSUS')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {capitalizeWords(activity.metadata?.kawasanType || '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activity.activity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.metadata?.kodeSWP || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.metadata?.kodeBlok || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.zones['Luas (Ha)']}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="max-h-32 overflow-y-auto">
                        {activity.zones['Ketentuan'] ? (
                          <div className="space-y-1">
                            {activity.zones['Ketentuan'].split(/\r?\n/).map((line, lineIndex) => (
                              <p key={lineIndex} className="text-xs leading-relaxed">
                                {line.trim()}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Tidak ada ketentuan</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Copy Format Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Format Copy Ketentuan</h3>
          <button
            onClick={() => {
              const copyText = generateCopyFormat(filteredActivities);
              navigator.clipboard.writeText(copyText).then(() => {
                alert('Format ketentuan berhasil disalin ke clipboard!');
              }).catch(() => {
                alert('Gagal menyalin ke clipboard');
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            📋 Copy Format
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {generateCopyFormat(filteredActivities)}
          </pre>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Ringkasan Data</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Ketentuan:</span>
            <span className="ml-2 font-medium">{data.activities.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Jenis Kawasan:</span>
            <span className="ml-2 font-medium">{kawasanTypes.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Diproses:</span>
            <span className="ml-2 font-medium">{new Date(data.metadata.processedAt).toLocaleDateString('id-ID')}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Baris:</span>
            <span className="ml-2 font-medium">{data.metadata.totalRows}</span>
          </div>
        </div>
      </div>
    </div>
  );
}