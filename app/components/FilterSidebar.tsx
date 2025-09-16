import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";

interface Activity {
  activity: string;
  activityNumber?: string;
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
  selectedRegulations: string[]; // Array of selected regulation codes
  availableRegulationsForZone: string[];
  onZoneChange?: () => void; // Optional callback for mobile
}

export default function FilterSidebar({
  data,
  selectedZone,
  selectedRegulation,
  selectedRegulations,
  availableRegulationsForZone,
  onZoneChange,
}: FilterSidebarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State untuk searchable dropdown
  const [zoneSearchTerm, setZoneSearchTerm] = useState(selectedZone || "");
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const zoneInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State untuk modal regulation combinations
  const [isRegulationModalOpen, setIsRegulationModalOpen] = useState(false);

  // Filter zones berdasarkan search term
  const filteredZones = data.zones.filter((zone) =>
    zone.toLowerCase().includes(zoneSearchTerm.toLowerCase())
  );

  // Update search term ketika selectedZone berubah dari luar
  useEffect(() => {
    setZoneSearchTerm(selectedZone || "");
  }, [selectedZone]);

  // Handle click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsZoneDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleZoneChange = (zone: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (zone) {
      newSearchParams.set("zone", zone);
    } else {
      newSearchParams.delete("zone");
    }
    newSearchParams.delete("regulation"); // Reset regulation when zone changes

    // Gunakan Remix navigate instead of window.location.reload
    navigate(`?${newSearchParams.toString()}`);

    if (onZoneChange) {
      onZoneChange();
    }
  };

  const handleZoneInputChange = (value: string) => {
    setZoneSearchTerm(value);
    setIsZoneDropdownOpen(true);
    setHighlightedIndex(-1);

    // Jika input kosong, reset zona
    if (!value.trim()) {
      handleZoneChange("");
    }
  };

  const handleZoneSelect = (zone: string) => {
    setZoneSearchTerm(zone);
    setIsZoneDropdownOpen(false);
    setHighlightedIndex(-1);
    handleZoneChange(zone);
  };

  const handleClearZone = () => {
    setZoneSearchTerm("");
    setIsZoneDropdownOpen(false);
    setHighlightedIndex(-1);
    handleZoneChange("");
  };

  const handleZoneInputKeyDown = (e: React.KeyboardEvent) => {
    if (!isZoneDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsZoneDropdownOpen(true);
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredZones.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredZones.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredZones[highlightedIndex]) {
          handleZoneSelect(filteredZones[highlightedIndex]);
        } else if (filteredZones.length === 1) {
          handleZoneSelect(filteredZones[0]);
        }
        break;
      case "Escape":
        setIsZoneDropdownOpen(false);
        setHighlightedIndex(-1);
        zoneInputRef.current?.blur();
        break;
    }
  };

  const handleRegulationChange = (regulation: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (regulation && regulation !== "-- Semua Kode --") {
      newSearchParams.set("regulation", regulation);
    } else {
      newSearchParams.delete("regulation");
    }

    // Gunakan Remix navigate instead of window.location.reload
    navigate(`?${newSearchParams.toString()}`);
  };

  // Handle individual regulation code toggle for multi-select
  const handleRegulationCodeToggle = (code: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    let newSelectedRegulations = [...selectedRegulations];

    if (newSelectedRegulations.includes(code)) {
      // Remove code if already selected
      newSelectedRegulations = newSelectedRegulations.filter((r) => r !== code);
    } else {
      // Add code if not selected
      newSelectedRegulations.push(code);
    }

    // Remove duplicates and ensure clean array
    newSelectedRegulations = [...new Set(newSelectedRegulations)];

    // Update URL params
    if (newSelectedRegulations.length > 0) {
      newSearchParams.set("regulations", newSelectedRegulations.join(";"));
    } else {
      newSearchParams.delete("regulations");
    }

    // Clear single regulation selection when using multi-select
    newSearchParams.delete("regulation");

    navigate(`?${newSearchParams.toString()}`);
  };

  // Handle "Select All" / "Clear All" for regulation codes
  const handleSelectAllRegulations = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    const allCombinations = getAvailableCombinations();

    if (selectedRegulations.length === allCombinations.length) {
      // Clear all if all are selected
      newSearchParams.delete("regulations");
    } else {
      // Select all if not all are selected
      newSearchParams.set("regulations", allCombinations.join(";"));
    }

    // Clear single regulation selection
    newSearchParams.delete("regulation");

    navigate(`?${newSearchParams.toString()}`);
  };

  // Get unique regulation codes that are actually used in the selected zone
  const getActiveRegulationCodes = () => {
    if (!selectedZone) return [];

    const activeCodesSet = new Set<string>();

    data.activities.forEach((activity) => {
      const zoneData = activity.zones[selectedZone];
      if (zoneData) {
        // Split by comma and extract individual codes
        const codes = zoneData.split(",").map((code) => code.trim());
        codes.forEach((code) => {
          if (code && code !== "") {
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
      if (zoneData && zoneData.trim()) {
        combinationsSet.add(zoneData.trim());
      }
    });

    return Array.from(combinationsSet).sort();
  };

  const activeRegulationCodes = getActiveRegulationCodes();
  const availableCombinations = getAvailableCombinations();

  // Filter selectedRegulations to only include valid combinations for current zone
  const validSelectedRegulations = selectedRegulations.filter((reg) =>
    availableCombinations.includes(reg)
  );

  // State untuk copy success untuk setiap kategori
  const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>(
    {}
  );

  // State untuk global copy success
  const [globalCopySuccess, setGlobalCopySuccess] = useState<boolean>(false);

  // Function untuk filter activities berdasarkan kategori
  const getActivitiesByCategory = (
    category: "diizinkan" | "terbatas" | "bersyarat" | "terbatas_bersyarat"
  ) => {
    if (!selectedZone) return [];

    return data.activities.filter((activity) => {
      const zoneData = activity.zones[selectedZone];
      if (!zoneData) return false;

      const codes = zoneData
        .split(",")
        .map((code) => code.trim())
        .filter((code) => code !== "");

      switch (category) {
        case "diizinkan":
          // Hanya kode I
          return codes.includes("I");

        case "terbatas":
          // Kombinasi T1, T2, T3 (tanpa B)
          const hasT = codes.some((code) => ["T1", "T2", "T3"].includes(code));
          const hasB = codes.some((code) => ["B1", "B2", "B3"].includes(code));
          return hasT && !hasB;

        case "bersyarat":
          // Kombinasi B1, B2, B3 (tanpa T)
          const hasBOnly = codes.some((code) =>
            ["B1", "B2", "B3"].includes(code)
          );
          const hasTOnly = codes.some((code) =>
            ["T1", "T2", "T3"].includes(code)
          );
          return hasBOnly && !hasTOnly;

        case "terbatas_bersyarat":
          // Kombinasi T1,T2,T3 DENGAN B1,B2,B3
          const hasTCombined = codes.some((code) =>
            ["T1", "T2", "T3"].includes(code)
          );
          const hasBCombined = codes.some((code) =>
            ["B1", "B2", "B3"].includes(code)
          );
          return hasTCombined && hasBCombined;

        default:
          return false;
      }
    });
  };

  // Function untuk copy JSON berdasarkan kategori
  const handleCopyJsonByCategory = async (
    category: "diizinkan" | "terbatas" | "bersyarat" | "terbatas_bersyarat"
  ) => {
    try {
      const activities = getActivitiesByCategory(category);

      // Mengumpulkan activityNumber dari aktivitas yang difilter
      const activityNumbers = activities
        .map((activity) => activity.activityNumber || "-")
        .filter((num) => num !== "-");

      // Mengurutkan nomor aktivitas dari terkecil ke terbesar
      activityNumbers.sort((a, b) => {
        // Ekstrak angka dari format "XXX-1801"
        const numA = a.split("-")[0];
        const numB = b.split("-")[0];
        return numA.localeCompare(numB, undefined, { numeric: true });
      });

      // Format JSON minify sesuai permintaan
      const jsonData = JSON.stringify({
        data: activityNumbers.length > 0 ? activityNumbers : "-",
      });

      await navigator.clipboard.writeText(jsonData);
      setCopySuccess((prev) => ({ ...prev, [category]: true }));
      setTimeout(() => {
        setCopySuccess((prev) => ({ ...prev, [category]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy JSON: ", err);
    }
  };

  // Generate global concatenated JSON for all categories with tab delimiters for Excel
  const generateGlobalConcatenatedJson = () => {
    const categories: ("diizinkan" | "terbatas" | "bersyarat" | "terbatas_bersyarat")[] = 
      ['diizinkan', 'terbatas', 'bersyarat', 'terbatas_bersyarat'];
    
    const jsonStrings = categories.map(category => {
      const activities = getActivitiesByCategory(category);
      const activityNumbers = activities
        .map((activity) => activity.activityNumber || "-")
        .filter((num) => num !== "-");
      
      activityNumbers.sort((a, b) => {
        const numA = a.split("-")[0];
        const numB = b.split("-")[0];
        return numA.localeCompare(numB, undefined, { numeric: true });
      });

      return JSON.stringify({
        data: activityNumbers.length > 0 ? activityNumbers : "-",
      });
    });
    
    return jsonStrings.join('\t'); // Use tab delimiter for Excel columns
  };

  // Copy all categories as concatenated JSON string
  const copyGlobalJson = async () => {
    try {
      const globalJsonText = generateGlobalConcatenatedJson();
      await navigator.clipboard.writeText(globalJsonText);
      setGlobalCopySuccess(true);
      setTimeout(() => setGlobalCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy global JSON: ', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
        {/* Zone Selection */}
        <div
          className="space-y-2 sm:space-y-2.5 md:space-y-3"
          ref={dropdownRef}
        >
          <label className="block text-sm sm:text-base md:text-base lg:text-lg font-medium text-gray-700">
            Pilih Zona
          </label>
          <div className="relative">
            <input
              ref={zoneInputRef}
              type="text"
              value={zoneSearchTerm}
              onChange={(e) => handleZoneInputChange(e.target.value)}
              onKeyDown={handleZoneInputKeyDown}
              onFocus={() => setIsZoneDropdownOpen(true)}
              placeholder="Ketik untuk mencari zona..."
              className="w-full px-3 sm:px-3.5 md:px-4 lg:px-4 py-2 sm:py-2.5 md:py-3 lg:py-3 text-sm sm:text-base md:text-base lg:text-lg text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-gray-400 pr-16"
            />

            {/* Clear Button */}
            {selectedZone && (
              <button
                type="button"
                onClick={handleClearZone}
                className="absolute inset-y-0 right-8 flex items-center pr-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Hapus zona"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* Dropdown Arrow */}
            <button
              type="button"
              onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isZoneDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown List */}
            {isZoneDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredZones.length > 0 ? (
                  <>
                    {zoneSearchTerm && !selectedZone && (
                      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                        {filteredZones.length} zona ditemukan
                      </div>
                    )}
                    {filteredZones.map((zone, index) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => handleZoneSelect(zone)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                          index === highlightedIndex
                            ? "bg-blue-100 text-blue-700"
                            : selectedZone === zone
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-900"
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    {zoneSearchTerm
                      ? "Tidak ada zona yang ditemukan"
                      : "Mulai ketik untuk mencari zona"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Helper text */}
          <div className="text-xs text-gray-500">
            {selectedZone ? (
              <span className="text-green-600">
                ✓ Zona terpilih: {selectedZone}
              </span>
            ) : (
              <span>
                Ketik nama zona atau klik panah untuk melihat semua opsi
              </span>
            )}
          </div>
        </div>

        {/* Regulation Selection - Only show if zone is selected */}
        {selectedZone && (
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm sm:text-base md:text-base lg:text-lg font-medium text-gray-700">
                Kode Regulasi
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllRegulations}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {validSelectedRegulations.length ===
                  availableCombinations.length
                    ? "Hapus Semua"
                    : "Pilih Semua"}
                </button>
                {validSelectedRegulations.length > 0 && (
                  <button
                    onClick={() => {
                      const newSearchParams = new URLSearchParams(searchParams);
                      newSearchParams.delete("regulations");
                      newSearchParams.delete("regulation");
                      navigate(`?${newSearchParams.toString()}`);
                    }}
                    className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Combination Filter (Legacy) */}
            <select
              value={selectedRegulation}
              onChange={(e) => handleRegulationChange(e.target.value)}
              className="w-full px-3 sm:px-3.5 md:px-4 lg:px-4 py-2 sm:py-2.5 md:py-3 lg:py-3 text-sm sm:text-base md:text-base lg:text-lg text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-gray-400"
            >
              <option value="" className="text-gray-500">
                -- Filter Kombinasi --
              </option>
              {availableRegulationsForZone.map((regulation) => (
                <option
                  key={regulation}
                  value={regulation}
                  className="text-gray-900"
                >
                  {regulation}
                </option>
              ))}
            </select>

            {/* Multi-select All Combinations - Modal Trigger */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Pilih Kombinasi Kode:
              </div>
              <button
                onClick={() => setIsRegulationModalOpen(true)}
                className="w-full px-4 py-3 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {validSelectedRegulations.length > 0
                      ? `${validSelectedRegulations.length} kombinasi terpilih`
                      : "Klik untuk memilih kombinasi kode"}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
            </div>

            {/* Selected regulations summary */}
            {validSelectedRegulations.length > 0 && (
              <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                <span className="font-medium">
                  Kode terpilih ({validSelectedRegulations.length}):
                </span>{" "}
                {validSelectedRegulations.join(", ")}
              </div>
            )}

            {/* Show available combinations info */}
            {availableRegulationsForZone.length > 0 && (
              <div className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-500 bg-gray-50 p-2 sm:p-2.5 md:p-3 rounded-md">
                <span className="font-medium">Kombinasi tersedia:</span>{" "}
                {availableRegulationsForZone.join(", ")}
              </div>
            )}
          </div>
        )}

        {/* Active Regulation Codes Legend - Only show if zone is selected */}
        {/* 4 Category Cards untuk Copy JSON - Only show if zone is selected */}
        {selectedZone && (
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
            <h3 className="text-sm sm:text-base md:text-base lg:text-lg font-medium text-gray-700">
              Copy JSON Berdasarkan Kategori
            </h3>
            {/* Global Copy Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={copyGlobalJson}
                className={`w-full inline-flex items-center justify-center px-4 py-3 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                  globalCopySuccess
                    ? "bg-blue-100 text-blue-700 border-blue-400"
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                }`}
              >
                {globalCopySuccess ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Semua Kategori Tersalin!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Copy Semua Kategori ke Excel
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Menyalin semua kategori dengan tab delimiter untuk Excel
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Diizinkan (I) */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-green-800">
                    Diizinkan
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                    I
                  </span>
                </div>
                <p className="text-xs text-green-600 mb-3">
                  {getActivitiesByCategory("diizinkan").length} kegiatan
                </p>
                <button
                  onClick={() => handleCopyJsonByCategory("diizinkan")}
                  className={`w-full inline-flex items-center justify-center px-3 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                    copySuccess.diizinkan
                      ? "bg-green-100 text-green-700 border-green-400"
                      : "bg-white text-green-700 hover:bg-green-50"
                  }`}
                >
                  {copySuccess.diizinkan ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      Copy JSON
                    </>
                  )}
                </button>
              </div>

              {/* Terbatas (T1,T2,T3) */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-yellow-800">
                    Terbatas
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    T1,T2,T3
                  </span>
                </div>
                <p className="text-xs text-yellow-600 mb-3">
                  {getActivitiesByCategory("terbatas").length} kegiatan
                </p>
                <button
                  onClick={() => handleCopyJsonByCategory("terbatas")}
                  className={`w-full inline-flex items-center justify-center px-3 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                    copySuccess.terbatas
                      ? "bg-yellow-100 text-yellow-700 border-yellow-400"
                      : "bg-white text-yellow-700 hover:bg-yellow-50"
                  }`}
                >
                  {copySuccess.terbatas ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      Copy JSON
                    </>
                  )}
                </button>
              </div>

              {/* Bersyarat (B1,B2,B3) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-800">
                    Bersyarat
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    B1,B2,B3
                  </span>
                </div>
                <p className="text-xs text-blue-600 mb-3">
                  {getActivitiesByCategory("bersyarat").length} kegiatan
                </p>
                <button
                  onClick={() => handleCopyJsonByCategory("bersyarat")}
                  className={`w-full inline-flex items-center justify-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                    copySuccess.bersyarat
                      ? "bg-blue-100 text-blue-700 border-blue-400"
                      : "bg-white text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  {copySuccess.bersyarat ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      Copy JSON
                    </>
                  )}
                </button>
              </div>

              {/* Terbatas Bersyarat (T+B) */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-purple-800">
                    Terbatas Bersyarat
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    T+B
                  </span>
                </div>
                <p className="text-xs text-purple-600 mb-3">
                  {getActivitiesByCategory("terbatas_bersyarat").length}{" "}
                  kegiatan
                </p>
                <button
                  onClick={() => handleCopyJsonByCategory("terbatas_bersyarat")}
                  className={`w-full inline-flex items-center justify-center px-3 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                    copySuccess.terbatas_bersyarat
                      ? "bg-purple-100 text-purple-700 border-purple-400"
                      : "bg-white text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  {copySuccess.terbatas_bersyarat ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      Copy JSON
                    </>
                  )}
                </button>
              </div>
            </div>

            
          </div>
        )}
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
                <span className="text-blue-600 font-semibold">
                  {selectedZone}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <span className="font-medium text-blue-700">
                  Kode Tersedia:
                </span>
                <span className="text-blue-600 font-semibold">
                  {activeRegulationCodes.length} kode
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <span className="font-medium text-blue-700">Kombinasi:</span>
                <span className="text-blue-600 font-semibold">
                  {availableRegulationsForZone.length} kombinasi
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Regulation Combinations Modal */}
      {isRegulationModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsRegulationModalOpen(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Pilih Kombinasi Kode Regulasi
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Zona: {selectedZone} • {availableCombinations.length}{" "}
                    kombinasi tersedia
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllRegulations}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    {validSelectedRegulations.length ===
                    availableCombinations.length
                      ? "Hapus Semua"
                      : "Pilih Semua"}
                  </button>
                  {validSelectedRegulations.length > 0 && (
                    <button
                      onClick={() => {
                        const newSearchParams = new URLSearchParams(
                          searchParams
                        );
                        newSearchParams.delete("regulations");
                        newSearchParams.delete("regulation");
                        navigate(`?${newSearchParams.toString()}`);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsRegulationModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Selected regulations summary */}
              {validSelectedRegulations.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-blue-900">
                      Kombinasi Terpilih ({validSelectedRegulations.length})
                    </div>
                    <button
                      onClick={() => {
                        const newSearchParams = new URLSearchParams(
                          searchParams
                        );
                        newSearchParams.delete("regulations");
                        newSearchParams.delete("regulation");
                        navigate(`?${newSearchParams.toString()}`);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {validSelectedRegulations.map((combination) => (
                      <div
                        key={combination}
                        className="inline-flex items-center justify-between gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md border border-blue-200"
                      >
                        <span className="truncate">{combination}</span>
                        <button
                          onClick={() =>
                            handleRegulationCodeToggle(combination)
                          }
                          className="text-blue-500 hover:text-blue-700 flex-shrink-0 ml-1"
                          title={`Hapus ${combination}`}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Combinations list */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {availableCombinations.map((combination, index) => {
                    const isSelected =
                      validSelectedRegulations.includes(combination);

                    // Get descriptions for all codes in the combination
                    const codes = combination.split(",").map((c) => c.trim());
                    const descriptions = codes
                      .map((code) => data.regulations[code])
                      .filter(Boolean);

                    return (
                      <label
                        key={combination}
                        className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${
                          index % 2 === 0 ? "md:border-r" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleRegulationCodeToggle(combination)
                          }
                          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base font-semibold text-gray-900">
                              {combination}
                            </span>
                            {isSelected && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Terpilih
                              </span>
                            )}
                          </div>
                          {descriptions.length > 0 && (
                            <div className="space-y-2">
                              {descriptions.map((desc, descIndex) => (
                                <div
                                  key={descIndex}
                                  className="flex items-start gap-2"
                                >
                                  <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold flex-shrink-0 ${
                                      codes[descIndex] === "I"
                                        ? "bg-green-100 text-green-800"
                                        : codes[descIndex] === "T1"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : codes[descIndex] === "T2"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : codes[descIndex] === "T3"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : codes[descIndex] === "B1"
                                        ? "bg-blue-100 text-blue-800"
                                        : codes[descIndex] === "B2"
                                        ? "bg-blue-100 text-blue-800"
                                        : codes[descIndex] === "B3"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {codes[descIndex]}
                                  </span>
                                  <span className="text-sm text-gray-600 leading-relaxed">
                                    {desc}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {validSelectedRegulations.length} dari{" "}
                  {availableCombinations.length} kombinasi terpilih
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsRegulationModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => setIsRegulationModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
