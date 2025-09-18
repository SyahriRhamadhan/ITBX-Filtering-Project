import React, { useState, useMemo } from 'react';
import intensitasDataTrikora from '../data/intensitas-data-merged.json';
import intensitasDataBsb from '../data/intensitas-data-merged-bsb.json';

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
    source?: string;
    sourceFile?: string;
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
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [currentJsonPreview, setCurrentJsonPreview] = useState('');
  const [currentJsonCategory, setCurrentJsonCategory] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);

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
         
         // Use capitalizeWords function for consistent formatting
         return capitalizeWords(formatted);
        };
      
      result += `${formatTabelName(tabel)}:\n`;
      
      kawasanMap.forEach((kawasanActivities, kawasanType) => {
        // Normal processing for all kawasanType
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
      });
    });
    
    return result.trim();
  };

  // Generate JSON format for ketentuan khusus
  const generateJsonForCategory = (activities: KepsusActivity[]) => {
    const result: any = {};
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

    groupedByTabel.forEach((kawasanMap, tabel) => {
      const formatTabelName = (name: string) => {
        let formatted = name.replace(/TABEL\s+/i, '');
        // Remove "Ketentuan Khusus" if it already exists to avoid duplication
        formatted = formatted.replace(/^Ketentuan\s+Khusus\s+/i, '');
        return capitalizeWords(formatted);
      };
      
      const tabelName = `Ketentuan Khusus ${formatTabelName(tabel)}`;
      result[tabelName] = {};
      
      kawasanMap.forEach((kawasanActivities, kawasanType) => {
        const kawasanName = capitalizeWords(kawasanType);
        result[tabelName][kawasanName] = {};
        
        const ketentuan = kawasanActivities[0].zones['Ketentuan'];
        if (ketentuan) {
          const lines = ketentuan.split(/\r?\n/).filter(line => line.trim());
          let letterIndex = 0;
          
          lines.forEach((line, i) => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('(Sumber:')) {
              const letter = String.fromCharCode(97 + letterIndex) + '.';
              
              let content;
              if (trimmedLine.match(/^\d+\./)) {
                content = trimmedLine.replace(/^\d+\.\s*/, '');
              } else {
                content = trimmedLine;
              }
              
              // Clean up existing punctuation to avoid duplication
              content = content.replace(/[;.]+$/, '').replace(/;\s*dan\s*$/, '').replace(/\s*dan\s*$/, '');
              
              result[tabelName][kawasanName][letter] = content;
              letterIndex++;
            }
          });
          
          // Add proper punctuation after all items are processed
          const keys = Object.keys(result[tabelName][kawasanName]);
          if (keys.length > 0) {
            keys.forEach((key, index) => {
              const content = result[tabelName][kawasanName][key];
              if (index === keys.length - 1) {
                // Last item ends with period
                result[tabelName][kawasanName][key] = content + '.';
              } else if (index === keys.length - 2 && keys.length > 1) {
                // Second to last item ends with "; dan"
                result[tabelName][kawasanName][key] = content + '; dan';
              } else {
                // Other items end with semicolon
                result[tabelName][kawasanName][key] = content + ';';
              }
            });
          }
        }
      });
    });
    
    return { data: result };
  };

  // Helper function to normalize text for matching
  const normalize = (text: string): string => {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  };

  // Get intensitas data based on zona and subzona
  const getIntensitasData = (zona?: string, subZona?: string) => {
    // Determine which dataset to use based on source
    const isBsb = data.metadata?.source === 'bsb' || 
                  data.metadata?.sourceFile?.includes('bsb') ||
                  window.location.pathname.includes('bsb');
    
    const intensitasData = isBsb ? intensitasDataBsb : intensitasDataTrikora;
    const rows = intensitasData.data || [];
    
    if (rows.length === 0) return null;
    
    const nz = zona ? normalize(zona) : '';
    const ns = subZona ? normalize(subZona) : '';
    
    if (nz || ns) {
      // Special handling for perumahan activities - prioritize exact subzona match
      if (ns && (ns.includes('perumahan') || ns.includes('kepadatan'))) {
        // 1) exact match subzona for perumahan
        const exactSub = rows.find((it: any) => normalize(it.SubZona) === ns);
        if (exactSub) return exactSub;
        
        // 2) contains match for specific kepadatan type
        if (ns.includes('kepadatan tinggi')) {
          const tinggiMatch = rows.find((it: any) => normalize(it.SubZona).includes('kepadatan tinggi'));
          if (tinggiMatch) return tinggiMatch;
        } else if (ns.includes('kepadatan sedang')) {
          const sedangMatch = rows.find((it: any) => normalize(it.SubZona).includes('kepadatan sedang'));
          if (sedangMatch) return sedangMatch;
        } else if (ns.includes('kepadatan rendah')) {
          const rendahMatch = rows.find((it: any) => normalize(it.SubZona).includes('kepadatan rendah'));
          if (rendahMatch) return rendahMatch;
        }
      }
      
      // Standard matching logic for non-perumahan or fallback
      // 1) exact match zona + subzona
      if (nz && ns) {
        const exactBoth = rows.find((it: any) => normalize(it.Zona) === nz && normalize(it.SubZona) === ns);
        if (exactBoth) return exactBoth;
      }
      
      // 2) exact match subzona saja
      if (ns) {
        const exactSub = rows.find((it: any) => normalize(it.SubZona) === ns);
        if (exactSub) return exactSub;
      }
      
      // 3) exact match zona saja
      if (nz) {
        const exactZona = rows.find((it: any) => normalize(it.Zona) === nz);
        if (exactZona) return exactZona;
      }
      
      // 4) contains (longgar) zona + subzona
      if (nz && ns) {
        const looseBoth = rows.find((it: any) => normalize(it.Zona).includes(nz) && normalize(it.SubZona).includes(ns));
        if (looseBoth) return looseBoth;
      }
      
      // 5) contains subzona saja (but avoid wrong perumahan matches)
      if (ns && !ns.includes('perumahan')) {
        const looseSub = rows.find((it: any) => normalize(it.SubZona).includes(ns));
        if (looseSub) return looseSub;
      }
    }
    return null;
  };

  // Generate minified JSON for copy
  const generateMinifiedJsonForCategory = (activities: KepsusActivity[]) => {
    const jsonData = generateJsonForCategory(activities);
    
    // Try to get intensitas data from the first activity's zona/subzona
    let intensitasData = null;
    if (activities.length > 0) {
      const firstActivity = activities[0];
      const zonaGuess = firstActivity.metadata?.kawasanType?.trim() ?? '';
      const subGuess = firstActivity.activity?.trim() ?? '';
      
      // Try multiple fallback strategies
      intensitasData = 
        getIntensitasData(zonaGuess, subGuess) ||
        getIntensitasData(zonaGuess) ||
        getIntensitasData('', subGuess);
        
      // Debug log to check what we found
      console.log('Cari intensitas (minified):', { zona: zonaGuess, subZona: subGuess, found: intensitasData });
    }
    
    // Helper function to format intensitas values
    const formatIntensitasValue = (value: any, unit: string = '') => {
      if (value === null || value === undefined || value === '') return 'Minimum: -';
      if (unit) return `Minimum: ${value} ${unit}`;
      return `Minimum: ${value}`;
    };

    // Format lantai bangunan data
    const formatLantaiBangunan = (intensitasData: any) => {
      if (!intensitasData) return '-';
      
      const arteri = intensitasData['Lantai Bangunan Maks. - Arteri'];
      const kolektor = intensitasData['Lantai Bangunan Maks. - Kolektor'];
      const lokal = intensitasData['Lantai Bangunan Maks. - Lokal'];
      
      if (!arteri && !kolektor && !lokal) return '-';
      
      const result: any = {};
      const entries = [];
      
      if (arteri) entries.push({ key: 'a.', value: `Jalan Arteri Maksimum = ${arteri} lantai` });
      if (kolektor) entries.push({ key: 'b.', value: `Jalan Kolektor Maksimum = ${kolektor} lantai` });
      if (lokal) entries.push({ key: 'c.', value: `Jalan Lokal Maksimum = ${lokal} lantai` });
      
      entries.forEach((entry, index) => {
        if (index === entries.length - 1) {
          // Last item ends with period
          result[entry.key] = `${entry.value}.`;
        } else if (index === entries.length - 2 && entries.length > 1) {
          // Second to last item ends with "; dan"
          result[entry.key] = `${entry.value}; dan`;
        } else {
          // Other items end with semicolon
          result[entry.key] = `${entry.value};`;
        }
      });
      
      return Object.keys(result).length > 0 ? result : '-';
    };
    
    // Create the combined JSON structure
    const combinedData = {
      data: jsonData,
      'Luas Kaveling Min. (m2)': formatIntensitasValue(intensitasData?.['Luas Kavling Min (m2)']),
      'Jarak Bebas Samping (m)': formatIntensitasValue(intensitasData?.['Jarak Bebas Samping Min. (m)'], 'm'),
      'Jarak Bebas Belakang (m)': formatIntensitasValue(intensitasData?.['Jarak Bebas Belakang Min. (m)'], 'm'),
      'Tampilan Bangunan': intensitasData?.['Tampilan Bangunan'] || '-',
      'Keterangan': intensitasData?.['Keterangan'] || '-',
      'Lantai Bangunan Maks.': formatLantaiBangunan(intensitasData)
    };
    
    return JSON.stringify(combinedData);
  };

  // Generate formatted JSON for preview
  const generateJsonForPreview = (activities: KepsusActivity[]) => {
    const jsonData = generateJsonForCategory(activities);
    
    // Try to get intensitas data from the first activity's zona/subzona
    let intensitasData = null;
    if (activities.length > 0) {
      const firstActivity = activities[0];
      const zonaGuess = firstActivity.metadata?.kawasanType?.trim() ?? '';
      const subGuess = firstActivity.activity?.trim() ?? '';
      
      // Try multiple fallback strategies
      intensitasData = 
        getIntensitasData(zonaGuess, subGuess) ||
        getIntensitasData(zonaGuess) ||
        getIntensitasData('', subGuess);
        
      // Debug log to check what we found
      console.log('Cari intensitas (preview):', { zona: zonaGuess, subZona: subGuess, found: intensitasData });
    }
    
    // Helper function to format intensitas values
    const formatIntensitasValue = (value: any, unit: string = '') => {
      if (value === null || value === undefined || value === '') return 'Minimum: -';
      if (unit) return `Minimum: ${value} ${unit}`;
      return `Minimum: ${value}`;
    };

    // Format lantai bangunan data
    const formatLantaiBangunan = (intensitasData: any) => {
      if (!intensitasData) return '-';
      
      const arteri = intensitasData['Lantai Bangunan Maks. - Arteri'];
      const kolektor = intensitasData['Lantai Bangunan Maks. - Kolektor'];
      const lokal = intensitasData['Lantai Bangunan Maks. - Lokal'];
      
      if (!arteri && !kolektor && !lokal) return '-';
      
      const result: any = {};
      const entries = [];
      
      if (arteri) entries.push({ key: 'a.', value: `Jalan Arteri Maksimum = ${arteri} ` });
      if (kolektor) entries.push({ key: 'b.', value: `Jalan Kolektor Maksimum = ${kolektor} ` });
      if (lokal) entries.push({ key: 'c.', value: `Jalan Lokal Maksimum = ${lokal} ` });
      
      entries.forEach((entry, index) => {
        if (index === entries.length - 1) {
          // Last item ends with period
          result[entry.key] = `${entry.value}.`;
        } else if (index === entries.length - 2 && entries.length > 1) {
          // Second to last item ends with "; dan"
          result[entry.key] = `${entry.value}; dan`;
        } else {
          // Other items end with semicolon
          result[entry.key] = `${entry.value};`;
        }
      });
      
      return Object.keys(result).length > 0 ? result : '-';
    };
    
    // Create the combined JSON structure
    const combinedData = {
      data: jsonData,
      'Luas Kaveling Min. (m2)': formatIntensitasValue(intensitasData?.['Luas Kavling Min (m2)']),
      'Jarak Bebas Samping (m)': formatIntensitasValue(intensitasData?.['Jarak Bebas Samping Min. (m)'], 'm'),
      'Jarak Bebas Belakang (m)': formatIntensitasValue(intensitasData?.['Jarak Bebas Belakang Min. (m)'], 'm'),
      'Tampilan Bangunan': intensitasData?.['Tampilan Bangunan'] || '-',
      'Keterangan': intensitasData?.['Keterangan'] || '-',
      'Lantai Bangunan Maks.': formatLantaiBangunan(intensitasData)
    };
    
    return JSON.stringify(combinedData, null, 2);
  };

  // Copy JSON data to clipboard
  const copyJsonData = (activities: KepsusActivity[]) => {
    const jsonText = generateMinifiedJsonForCategory(activities);
    navigator.clipboard.writeText(jsonText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(() => {
      alert('Gagal menyalin ke clipboard');
    });
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

      {/* Preview and Copy Buttons */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview & Copy Data Ketentuan Khusus</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const jsonText = generateJsonForPreview(filteredActivities);
              setCurrentJsonPreview(jsonText);
              setCurrentJsonCategory("Data Ketentuan Khusus");
              setShowJsonModal(true);
            }}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex-1"
          >
            Preview
          </button>
          <button
            onClick={() => copyJsonData(filteredActivities)}
            className={`px-4 py-2 rounded-md transition-colors flex-1 ${
              copySuccess
                ? "bg-green-600 text-white"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {copySuccess
              ? "✓ Data Tersalin!"
              : "Copy Data ke Excel"}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Gunakan "Preview" untuk melihat format JSON dengan indentasi, dan "Copy Data ke Excel" untuk menyalin data dalam format minified.
        </p>
      </div>

      {/* Results - Table Format */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Tabel Data Ketentuan Khusus</h3>
          <button
            onClick={() => setIsTableExpanded(!isTableExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isTableExpanded ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Tutup Tabel
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Buka Tabel
              </>
            )}
          </button>
        </div>
        
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada data yang sesuai dengan filter.</p>
          </div>
        ) : (
          isTableExpanded && (
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
          )
        )}
      </div>

      {/* Copy Format Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Format Copy Ketentuan</h3>
          <div className="flex space-x-2">
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
            <button
              onClick={() => {
                const jsonPreview = generateJsonForPreview(filteredActivities);
                setCurrentJsonPreview(jsonPreview);
                setShowJsonModal(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              👁️ Preview JSON
            </button>
            <button
              onClick={() => copyJsonData(filteredActivities)}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                copySuccess
                  ? 'bg-green-600 '
                  : 'bg-green-600  hover:bg-green-700'
              }`}
            >
              {copySuccess ? '✓ Tersalin!' : '📋 Copy JSON Format'}
            </button>
          </div>
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

      {/* JSON Preview Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Preview JSON - {currentJsonCategory}</h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => copyJsonData(filteredActivities)}
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    copySuccess
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copySuccess ? '✓ Tersalin!' : '📋 Copy Minified JSON'}
                </button>
                <div className="text-sm text-gray-600 flex items-center">
                  Format minified (tanpa spasi) untuk penggunaan dalam aplikasi
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {currentJsonPreview}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}