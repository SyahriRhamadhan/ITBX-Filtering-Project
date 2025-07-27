import { useState } from "react";

interface Activity {
  activity: string;
  zones: Record<string, string>;
}

interface RDTRData {
  activities: Activity[];
  zones: string[];
  regulations: Record<string, string>;
}

interface FilterSidebarProps {
  data: RDTRData;
  selectedZone: string;
  selectedRegulation: string;
  availableRegulationsForZone: string[];
  onZoneChange?: () => void; // Optional callback for mobile
}

export default function FilterSidebar({
  data,
  selectedZone,
  selectedRegulation,
  availableRegulationsForZone,
  onZoneChange,
}: FilterSidebarProps) {
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  const handleZoneChange = (zone: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (zone) {
      newSearchParams.set("zone", zone);
    } else {
      newSearchParams.delete("zone");
    }
    newSearchParams.delete("regulation"); // Reset regulation when zone changes
    
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `?${newSearchParams.toString()}`);
      window.location.reload();
    }
    
    if (onZoneChange) {
      onZoneChange();
    }
  };

  const handleRegulationChange = (regulation: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (regulation && regulation !== "-- Semua Kode --") {
      newSearchParams.set("regulation", regulation);
    } else {
      newSearchParams.delete("regulation");
    }
    
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `?${newSearchParams.toString()}`);
      window.location.reload();
    }
  };

  // Get unique regulation codes that are actually used in the selected zone
  const getActiveRegulationCodes = () => {
    if (!selectedZone) return [];
    
    const activeCodesSet = new Set<string>();
    
    data.activities.forEach((activity) => {
      const zoneData = activity.zones[selectedZone];
      if (zoneData) {
        // Split by comma and extract individual codes
        const codes = zoneData.split(',').map(code => code.trim());
        codes.forEach(code => {
          if (code && code !== '') {
            activeCodesSet.add(code);
          }
        });
      }
    });
    
    return Array.from(activeCodesSet).sort();
  };

  // Get available regulation combinations for display
  const getAvailableCombinations = () => {
    if (!selectedZone) return [];
    
    const combinationsSet = new Set<string>();
    
    data.activities.forEach((activity) => {
      const zoneData = activity.zones[selectedZone];
      if (zoneData) {
        combinationsSet.add(zoneData.trim());
      }
    });
    
    return Array.from(combinationsSet).sort();
  };

  const activeRegulationCodes = getActiveRegulationCodes();
  const availableCombinations = getAvailableCombinations();

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
        {/* Zone Selection */}
        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          <label className="block text-sm sm:text-base md:text-base lg:text-lg font-medium text-gray-700">
            Pilih Zona
          </label>
          <select
            value={selectedZone}
            onChange={(e) => handleZoneChange(e.target.value)}
            className="w-full px-3 sm:px-3.5 md:px-4 lg:px-4 py-2 sm:py-2.5 md:py-3 lg:py-3 text-sm sm:text-base md:text-base lg:text-lg text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-gray-400"
          >
            <option value="" className="text-gray-500">-- Pilih Zona --</option>
            {data.zones.map((zone) => (
              <option key={zone} value={zone} className="text-gray-900">
                {zone}
              </option>
            ))}
          </select>
        </div>

        {/* Regulation Selection - Only show if zone is selected */}
        {selectedZone && (
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
            <label className="block text-sm sm:text-base md:text-base lg:text-lg font-medium text-gray-700">
              Kode Regulasi
            </label>
            <select
              value={selectedRegulation}
              onChange={(e) => handleRegulationChange(e.target.value)}
              className="w-full px-3 sm:px-3.5 md:px-4 lg:px-4 py-2 sm:py-2.5 md:py-3 lg:py-3 text-sm sm:text-base md:text-base lg:text-lg text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-gray-400"
            >
              <option value="" className="text-gray-500">-- Semua Kode --</option>
              {availableRegulationsForZone.map((regulation) => (
                <option key={regulation} value={regulation} className="text-gray-900">
                  {regulation}
                </option>
              ))}
            </select>
            
            {/* Show available combinations info */}
            {availableRegulationsForZone.length > 0 && (
              <div className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-500 bg-gray-50 p-2 sm:p-2.5 md:p-3 rounded-md">
                <span className="font-medium">Kombinasi tersedia:</span> {availableRegulationsForZone.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Active Regulation Codes Legend - Only show if zone is selected */}
        {selectedZone && activeRegulationCodes.length > 0 && (
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
            <h3 className="text-sm sm:text-base md:text-base lg:text-lg font-medium text-gray-700">
              Keterangan Kode Aktif
            </h3>
            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 max-h-48 sm:max-h-64 md:max-h-72 lg:max-h-80 overflow-y-auto border border-gray-200 rounded-md p-2 sm:p-3 md:p-3 lg:p-4 bg-gray-50">
              {activeRegulationCodes.map((code) => {
                const description = data.regulations[code];
                if (!description) return null;
                
                return (
                  <div
                    key={code}
                    className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-3 p-2 sm:p-2.5 md:p-3 lg:p-3 rounded-md bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-100"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-md text-xs sm:text-sm md:text-sm lg:text-base font-bold flex-shrink-0 ${
                        code === "I"
                          ? "bg-green-100 text-green-800"
                          : code === "T1"
                          ? "bg-yellow-100 text-yellow-800"
                          : code === "T2"
                          ? "bg-yellow-100 text-yellow-800"
                          : code === "T3"
                          ? "bg-yellow-100 text-yellow-800"
                          : code === "B1"
                          ? "bg-blue-100 text-blue-800"
                          : code === "B2"
                          ? "bg-blue-100 text-blue-800"
                          : code === "B3"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-900 leading-relaxed break-words">
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Zone Info */}
        {selectedZone && (
          <div className="pt-3 sm:pt-3.5 md:pt-4 lg:pt-4 border-t border-gray-200">
            <div className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-500 space-y-1 sm:space-y-1.5 md:space-y-2 bg-blue-50 p-2 sm:p-2.5 md:p-3 lg:p-3 rounded-md">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <span className="font-medium text-blue-700">Zona Aktif:</span> 
                <span className="text-blue-600 font-semibold">{selectedZone}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <span className="font-medium text-blue-700">Kode Tersedia:</span> 
                <span className="text-blue-600 font-semibold">{activeRegulationCodes.length} kode</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <span className="font-medium text-blue-700">Kombinasi:</span> 
                <span className="text-blue-600 font-semibold">{availableRegulationsForZone.length} kombinasi</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
