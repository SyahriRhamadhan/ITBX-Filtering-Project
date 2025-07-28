import { useState } from "react";

interface Activity {
  activity: string;
  zones: Record<string, string>;
}

interface ActivityListProps {
  activities: Activity[];
  selectedZone: string;
  selectedRegulation: string;
  searchTerm: string;
}

export default function ActivityList({
  activities,
  selectedZone,
  selectedRegulation,
  searchTerm,
}: ActivityListProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyList = async () => {
    try {
      const activityList = activities.map(activity => activity.activity).join('\n');
      await navigator.clipboard.writeText(activityList);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8 lg:p-12 text-center">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
            Tidak ada kegiatan ditemukan
          </h3>
          <p className="text-sm sm:text-base text-gray-500">
            {searchTerm
              ? `Tidak ada kegiatan yang cocok dengan pencarian "${searchTerm}"`
              : selectedRegulation
              ? `Tidak ada kegiatan untuk regulasi ${selectedRegulation} di zona ${selectedZone}`
              : `Tidak ada kegiatan di zona ${selectedZone}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header dengan tombol copy */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Daftar Kegiatan
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {activities.length} kegiatan ditemukan
            </p>
          </div>
          <button
            onClick={handleCopyList}
            className={`inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
              copySuccess
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {copySuccess ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tersalin!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Daftar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Daftar aktivitas */}
      {activities.map((activity, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col space-y-3 sm:space-y-4">
            {/* Activity Name */}
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 leading-tight">
              {activity.activity}
            </h3>

            {/* Regulation Codes */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {selectedZone && activity.zones[selectedZone] ? (
                // Show unique regulation codes for the selected zone
                (() => {
                  const regulation = activity.zones[selectedZone];
                  const uniqueCodes = [...new Set(regulation.split(',').map(code => code.trim()).filter(code => code !== ''))];
                  
                  return uniqueCodes.map((code, codeIndex) => (
                    <span
                      key={`${selectedZone}-${code}-${codeIndex}`}
                      className={`inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium ${
                        code === "T1"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : code === "B1"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : code === "B3"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-green-100 text-green-800 border border-green-200"
                      }`}
                    >
                      {code}
                    </span>
                  ));
                })()
              ) : (
                // Show all zones when no zone is selected
                Object.entries(activity.zones).map(([zone, regulation]) => (
                  <span
                    key={zone}
                    className="bg-gray-100 text-gray-600 border border-gray-200 inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium"
                  >
                    {zone}: {regulation}
                  </span>
                ))
              )}
            </div>

            {/* Zone Information (for mobile) */}
            <div className="block sm:hidden">
              <div className="text-xs text-gray-500">
                Zona: {Object.keys(activity.zones).join(", ")}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}