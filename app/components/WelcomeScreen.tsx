interface Activity {
  activity: string;
  zones: Record<string, string>;
}

interface RDTRData {
  activities: Activity[];
  zones: string[];
  regulations: Record<string, string>;
}

interface WelcomeScreenProps {
  data: RDTRData;
}

export default function WelcomeScreen({ data }: WelcomeScreenProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8 lg:p-12">
      <div className="text-center max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            RDTR Filter Application
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
            Aplikasi untuk memfilter dan mencari kegiatan berdasarkan zona dan regulasi RDTR
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-100">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
              {data.activities.length}
            </div>
            <div className="text-sm sm:text-base text-blue-800 font-medium">
              Total Kegiatan
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 sm:p-6 border border-green-100">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-2">
              {data.zones.length}
            </div>
            <div className="text-sm sm:text-base text-green-800 font-medium">
              Zona Tersedia
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 sm:p-6 border border-purple-100 sm:col-span-2 lg:col-span-1">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-2">
              {Object.keys(data.regulations).length}
            </div>
            <div className="text-sm sm:text-base text-purple-800 font-medium">
              Kode Regulasi
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 lg:p-8 text-left">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 text-center">
            Cara Menggunakan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-1">
                    Pilih Zona
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Pilih zona dari sidebar untuk melihat kegiatan yang tersedia
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-1">
                    Filter Regulasi
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Pilih kode regulasi untuk memfilter kegiatan lebih spesifik
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-1">
                    Cari Kegiatan
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Gunakan kotak pencarian untuk mencari kegiatan tertentu
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-1">
                    Export Data
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Export hasil pencarian ke format text, CSV, atau Excel
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Regulations Legend */}
        <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Kode Regulasi Tersedia
          </h3>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {Object.entries(data.regulations).map(([code, description]) => (
              <div
                key={code}
                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium border ${
                  code === "T1"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : code === "B1"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : code === "B3"
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : "bg-green-100 text-green-800 border-green-200"
                }`}
                title={description}
              >
                {code}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
