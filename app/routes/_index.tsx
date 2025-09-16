import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams, Link } from "@remix-run/react";
import { useState, useMemo } from "react";
import fs from "fs";
import path from "path";
import FilterSidebar from "~/components/FilterSidebar";
import SearchAndSortBar from "~/components/SearchAndSortBar";
import ActivityList from "~/components/ActivityList";
import WelcomeScreen from "~/components/WelcomeScreen";
import { exportToText, exportToCSV, exportToExcel } from "~/utils/exportUtils";

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

type SortOrder = "asc" | "desc";

export const meta: MetaFunction = () => {
  return [
    {
      title:
        "RDTR Filter - Sistem Filtering Ketentuan Kegiatan dan Penggunaan Lahan",
    },
    {
      name: "description",
      content:
        "Aplikasi untuk memfilter ketentuan kegiatan dan penggunaan lahan berdasarkan zona dan kode regulasi",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const dataSource = url.searchParams.get("dataSource") || "trikora";
    const selectedZone = url.searchParams.get("zone") || "";
    const selectedRegulation = url.searchParams.get("regulation") || "";
    
    // Properly decode URL parameter for regulations
    const regulationsParam = url.searchParams.get("regulations");
    
    // Decode URL-encoded parameter and split by semicolon (to avoid conflict with comma in combinations like "B1,B3")
    const selectedRegulations = regulationsParam 
      ? [...new Set(decodeURIComponent(regulationsParam).split(";").filter(Boolean))]
      : [];

    // Load data based on selected source
    const dataFileName = dataSource === "bsb" ? "bsb-data.json" : "rdtr-data.json";
    const dataPath = path.join(process.cwd(), "app", "data", dataFileName);
    
    let data: RDTRData;
    try {
      data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch (fileError) {
      console.error(`Error loading ${dataFileName}:`, fileError);
      // Fallback to default data
      const fallbackPath = path.join(process.cwd(), "app", "data", "rdtr-data.json");
      data = JSON.parse(fs.readFileSync(fallbackPath, "utf-8"));
    }

    return json({
      data,
      dataSource: dataSource as 'trikora' | 'bsb',
      selectedZone,
      selectedRegulation,
      selectedRegulations,
    });
  } catch (error) {
    console.error("Error loading RDTR data:", error);
    return json({
      data: { activities: [], zones: [], regulations: {} } as RDTRData,
      dataSource: "trikora" as const,
      selectedZone: "",
      selectedRegulation: "",
      selectedRegulations: [] as string[],
    });
  }
}

export default function RDTRFilter() {
  const { data, dataSource, selectedZone, selectedRegulation, selectedRegulations } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle data source change
  const handleDataSourceChange = (newDataSource: 'trikora' | 'bsb') => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('dataSource', newDataSource);
    // Clear zone and regulation when switching data sources
    newSearchParams.delete('zone');
    newSearchParams.delete('regulation');
    newSearchParams.delete('regulations');
    navigate(`?${newSearchParams.toString()}`);
  };

  // Filter and sort activities based on selected zone, regulation, and search term
  const filteredAndSortedActivities = useMemo(() => {
    if (!selectedZone) return [];

    let filtered = data.activities
      .filter((activity: Activity) => {
        // Check if activity has data for the selected zone
        const zoneData = activity.zones[selectedZone];
        if (!zoneData) return false;

        // If using combination filter (legacy)
        if (selectedRegulation) {
          return zoneData.trim() === selectedRegulation;
        }

        // If using multi-select regulation combinations
        if (selectedRegulations.length > 0) {
          // Check if the activity's zone data matches ANY of the selected regulation combinations
          return selectedRegulations.includes(zoneData.trim());
        }

        // If no regulation filter, show all activities for this zone
        return true;
      })
      .filter((activity: Activity) => {
        // Apply search term filter
        if (!searchTerm) return true;
        return activity.activity
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });

    // Sort activities
    return filtered.sort((a, b) => {
      const comparison = a.activity.localeCompare(b.activity, "id", {
        sensitivity: "base",
      });
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [
    data.activities,
    selectedZone,
    selectedRegulation,
    selectedRegulations,
    searchTerm,
    sortOrder,
  ]);

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

  // Handle export functionality
  const handleExport = (format: "text" | "csv" | "xlsx") => {
    switch (format) {
      case "text":
        exportToText(
          filteredAndSortedActivities,
          selectedZone,
          selectedRegulation,
          data
        );
        break;
      case "csv":
        exportToCSV(
          filteredAndSortedActivities,
          selectedZone,
          selectedRegulation,
          data
        );
        break;
      case "xlsx":
        exportToExcel(
          filteredAndSortedActivities,
          selectedZone,
          selectedRegulation,
          data
        );
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                RDTR Filter - Ketentuan Kegiatan dan Penggunaan Lahan
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Sistem filtering untuk mengetahui ketentuan kegiatan berdasarkan
                zona dan kode regulasi
              </p>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-3 mx-4">
              <Link
                to="/html-parser"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                HTML Parser
              </Link>
              <Link
                to="/intensitas"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                Filter Intensitas
              </Link>
              <Link
                to="/kepsus"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Ketentuan Khusus
              </Link>
            </div>
            
            {/* Data Source Switch */}
            <div className="hidden sm:flex items-center gap-2 mx-4">
              <span className="text-sm text-gray-600">Data:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleDataSourceChange('trikora')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    dataSource === 'trikora'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Trikora
                </button>
                <button
                  onClick={() => handleDataSourceChange('bsb')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    dataSource === 'bsb'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  BSB
                </button>
              </div>
            </div>
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden ml-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle filters"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
          </div>
          
          {/* Mobile Data Source Switch */}
          <div className="sm:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">Sumber Data:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleDataSourceChange('trikora')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    dataSource === 'trikora'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Trikora
                </button>
                <button
                  onClick={() => handleDataSourceChange('bsb')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    dataSource === 'bsb'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  BSB
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)} />
              <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <FilterSidebar
                    data={data}
                    selectedZone={selectedZone}
                    selectedRegulation={selectedRegulation}
                    selectedRegulations={selectedRegulations}
                    availableRegulationsForZone={availableRegulationsForZone}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
            <FilterSidebar
              data={data}
              selectedZone={selectedZone}
              selectedRegulation={selectedRegulation}
              selectedRegulations={selectedRegulations}
              availableRegulationsForZone={availableRegulationsForZone}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {selectedZone ? (
              <>
                {/* Search and Sort Bar */}
                <SearchAndSortBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  sortOrder={sortOrder}
                  onSortChange={setSortOrder}
                  resultCount={filteredAndSortedActivities.length}
                  onExport={handleExport}
                  filteredActivities={filteredAndSortedActivities}
                  selectedZone={selectedZone}
                  selectedRegulation={selectedRegulation}
                  data={data}
                />

                {/* Results Header */}
                <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Zona: {selectedZone}
                  </h2>
                  {(selectedRegulation || selectedRegulations.length > 0) && (
                    <div className="mt-2 sm:mt-1">
                      <p className="text-sm sm:text-base text-gray-600 break-words">
                        Filter:{" "}
                        {selectedRegulations.length > 0 ? (
                          <span className="inline-flex flex-wrap gap-1">
                            {selectedRegulations.map((code, index) => (
                              <span key={code} className="inline-flex items-center px-2 py-1 rounded text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                                {code}
                                <span className="hidden sm:inline ml-1">
                                  - {data.regulations[code] || code}
                                </span>
                              </span>
                            ))}
                          </span>
                        ) : selectedRegulation ? (
                          <>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs sm:text-sm font-medium bg-gray-100 text-gray-800">
                              {selectedRegulation}
                            </span>
                            <span className="hidden sm:inline">
                              {(() => {
                                const codes = selectedRegulation
                                  .split(",")
                                  .map((c) => c.trim());
                                const descriptions = codes.map(
                                  (code) => data.regulations[code] || code
                                );
                                return codes.length === 1
                                  ? ` - ${descriptions[0]}`
                                  : ` - ${descriptions.join(" + ")}`;
                              })()}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  )}
                </div>

                {/* Activities List */}
                <ActivityList
                  activities={filteredAndSortedActivities}
                  selectedZone={selectedZone}
                  selectedRegulation={selectedRegulation}
                  searchTerm={searchTerm}
                />
              </>
            ) : (
              <WelcomeScreen 
                data={data} 
                currentDataSource={dataSource}
                onDataSourceChange={handleDataSourceChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
