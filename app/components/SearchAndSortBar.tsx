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

type SortOrder = "asc" | "desc";

interface SearchAndSortBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  resultCount: number;
  onExport: (format: "text" | "csv" | "xlsx") => void;
  filteredActivities: Activity[];
  selectedZone: string;
  selectedRegulation: string;
  data: RDTRData;
}

export default function SearchAndSortBar({
  searchTerm,
  onSearchChange,
  sortOrder,
  onSortChange,
  resultCount,
  onExport,
  filteredActivities,
  selectedZone,
  selectedRegulation,
  data,
}: SearchAndSortBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = (format: "text" | "csv" | "xlsx") => {
    onExport(format);
    setShowExportMenu(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col space-y-3 sm:space-y-4">
        {/* Top Row: Search Input */}
        <div className="w-full">
          <input
            type="text"
            placeholder="Cari kegiatan..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Bottom Row: Controls and Result Count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left Side: Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Urutkan:
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => onSortChange("asc")}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  sortOrder === "asc"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
                title="Urutkan A-Z"
              >
                A-Z
              </button>
              <button
                onClick={() => onSortChange("desc")}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  sortOrder === "desc"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
                title="Urutkan Z-A"
              >
                Z-A
              </button>
            </div>
          </div>

          {/* Right Side: Export Button and Result Count */}
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Result Count */}
            <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              {resultCount} kegiatan ditemukan
            </div>

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={resultCount === 0}
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="hidden xs:inline">Export</span>
              </button>

              {/* Export Menu */}
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport("text")}
                      className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
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
                      Copy sebagai Text
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download CSV
                    </button>
                    <button
                      onClick={() => handleExport("xlsx")}
                      className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Close export menu when clicking outside */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
