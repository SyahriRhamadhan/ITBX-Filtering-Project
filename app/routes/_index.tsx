import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form, useSearchParams } from "@remix-run/react";
import { useState, useMemo } from "react";
import fs from "fs";
import path from "path";

// Type definitions
interface Activity {
  activity: string;
  zones: Record<string, string>;
}

interface RDTRData {
  activities: Activity[];
  zones: string[];
  regulations: Record<string, string>;
}

export const meta: MetaFunction = () => {
  return [
    { title: "RDTR Filter - Sistem Filtering Ketentuan Kegiatan dan Penggunaan Lahan" },
    { name: "description", content: "Aplikasi untuk memfilter ketentuan kegiatan dan penggunaan lahan berdasarkan zona dan kode regulasi" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const dataPath = path.join(process.cwd(), 'app', 'data', 'rdtr-data.json');
    const data: RDTRData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    const url = new URL(request.url);
    const selectedZone = url.searchParams.get('zone') || '';
    const selectedRegulation = url.searchParams.get('regulation') || '';
    
    return json({ 
      data,
      selectedZone,
      selectedRegulation
    });
  } catch (error) {
    console.error('Error loading RDTR data:', error);
    return json({ 
      data: { activities: [], zones: [], regulations: {} } as RDTRData,
      selectedZone: '',
      selectedRegulation: ''
    });
  }
}

export default function RDTRFilter() {
  const { data, selectedZone, selectedRegulation } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter activities based on selected zone and regulation
  const filteredActivities = useMemo(() => {
    if (!selectedZone) return [];
    
    return data.activities.filter((activity: Activity) => {
      // Check if activity has data for the selected zone
      const zoneData = activity.zones[selectedZone];
      if (!zoneData) return false;
      
      // If no regulation filter, show all activities for this zone
      if (!selectedRegulation) return true;
      
      // Check if the zone data exactly matches the selected regulation combination
      return zoneData.trim() === selectedRegulation;
    }).filter((activity: Activity) => {
      // Apply search term filter
      if (!searchTerm) return true;
      return activity.activity.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data.activities, selectedZone, selectedRegulation, searchTerm]);

  // Get available regulation combinations for the selected zone
  const availableRegulationsForZone = useMemo(() => {
    if (!selectedZone) return [];
    
    const regulationCombinationsSet = new Set<string>();
    data.activities.forEach((activity: Activity) => {
      const zoneData = activity.zones[selectedZone];
      if (zoneData) {
        // Add the full combination as it appears in the data
        regulationCombinationsSet.add(zoneData.trim());
      }
    });
    
    return Array.from(regulationCombinationsSet).sort();
  }, [data.activities, selectedZone]);

  const regulationCodes = ['I', 'T', 'T1', 'T2', 'T3', 'B', 'B1', 'B2', 'B3', 'X'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            RDTR Filter - Ketentuan Kegiatan dan Penggunaan Lahan
          </h1>
          <p className="mt-2 text-gray-600">
            Sistem filtering untuk mengetahui ketentuan kegiatan berdasarkan zona dan kode regulasi
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter</h2>
              
              <Form method="get" className="space-y-6">
                {/* Zone Filter */}
                <div>
                  <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Zona
                  </label>
                  <select
                    id="zone"
                    name="zone"
                    value={selectedZone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => {
                      const form = e.target.form;
                      if (form) form.submit();
                    }}
                  >
                    <option value="">-- Pilih Zona --</option>
                    {data.zones.map((zone: string) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Regulation Filter */}
                {selectedZone && (
                  <div>
                    <label htmlFor="regulation" className="block text-sm font-medium text-gray-700 mb-2">
                      Kode Regulasi
                    </label>
                    <select
                      id="regulation"
                      name="regulation"
                      value={selectedRegulation}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => {
                        const form = e.target.form;
                        if (form) form.submit();
                      }}
                    >
                      <option value="">-- Semua Kode --</option>
                      {availableRegulationsForZone.map((combination: string) => {
                        // Create a description for the combination
                        const codes = combination.split(',').map(c => c.trim());
                        const descriptions = codes.map(code => data.regulations[code] || code);
                        const displayText = codes.length === 1 
                          ? `${combination} - ${descriptions[0]}`
                          : `${combination} - ${descriptions.join(' + ')}`;
                        
                        return (
                          <option key={combination} value={combination}>
                            {displayText}
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Show available regulation combinations for this zone */}
                    <div className="mt-2 text-xs text-gray-500">
                      Kombinasi tersedia: {availableRegulationsForZone.join(', ')}
                    </div>
                  </div>
                )}
              </Form>

              {/* Regulation Legend */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Keterangan Kode</h3>
                <div className="space-y-2 text-xs">
                  {Object.entries(data.regulations).map(([code, description]: [string, string]) => (
                    <div key={code} className="flex items-start gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        code === 'I' ? 'bg-green-100 text-green-800' :
                        code === 'X' ? 'bg-red-100 text-red-800' :
                        code.startsWith('T') ? 'bg-yellow-100 text-yellow-800' :
                        code.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {code}
                      </span>
                      <span className="text-gray-600 leading-tight">{String(description)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedZone ? (
              <>
                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Cari kegiatan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {filteredActivities.length} kegiatan ditemukan
                    </div>
                  </div>
                </div>

                {/* Results Header */}
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Zona: {selectedZone}
                  </h2>
                  {selectedRegulation && (
                    <p className="mt-1 text-gray-600">
                      Filter: <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                        {selectedRegulation}
                      </span>
                      {(() => {
                        const codes = selectedRegulation.split(',').map(c => c.trim());
                        const descriptions = codes.map(code => data.regulations[code] || code);
                        return codes.length === 1 
                          ? ` - ${descriptions[0]}`
                          : ` - ${descriptions.join(' + ')}`;
                      })()}
                    </p>
                  )}
                </div>

                {/* Activities List */}
                <div className="space-y-4">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity: Activity, index: number) => (
                      <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          {activity.activity}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {activity.zones[selectedZone]?.split(',').map((regulation: string, regIndex: number) => {
                            const code = regulation.trim();
                            return (
                              <span
                                key={regIndex}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  code === 'I' ? 'bg-green-100 text-green-800' :
                                  code === 'X' ? 'bg-red-100 text-red-800' :
                                  code.startsWith('T') ? 'bg-yellow-100 text-yellow-800' :
                                  code.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                                title={data.regulations[code] || code}
                              >
                                {code}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada kegiatan ditemukan</h3>
                      {selectedRegulation ? (
                        <div className="text-gray-500">
                          <p className="mb-2">
                            Tidak ada kegiatan dengan kombinasi kode <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                              {selectedRegulation}
                            </span> di zona ini.
                          </p>
                          <p className="text-sm">
                            Kombinasi yang tersedia untuk zona <strong>{selectedZone}</strong>: {availableRegulationsForZone.join(', ')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          {searchTerm 
                            ? `Tidak ada kegiatan yang mengandung "${searchTerm}" di zona ini`
                            : 'Tidak ada kegiatan yang sesuai dengan pencarian'
                          }
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Selamat Datang di RDTR Filter
                </h2>
                <p className="text-gray-600 mb-6">
                  Pilih zona dari sidebar untuk melihat ketentuan kegiatan dan penggunaan lahan
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">📊 Data Tersedia</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• {data.activities.length} kegiatan</li>
                      <li>• {data.zones.length} zona</li>
                      <li>• {Object.keys(data.regulations).length} kode regulasi</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">🎯 Cara Penggunaan</h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Pilih zona dari dropdown</li>
                      <li>• Filter berdasarkan kode regulasi</li>
                      <li>• Cari kegiatan spesifik</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
