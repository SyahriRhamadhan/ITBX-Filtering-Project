import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { readFileSync } from 'fs';
import { join } from 'path';
import KepsusFilter from '~/components/KepsusFilter';

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
    source: string;
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
    source: string;
    sourceFile: string;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const dataPath = join(process.cwd(), 'app', 'data', 'kepsus-bsb-data.json');
    const fileContent = readFileSync(dataPath, 'utf-8');
    const kepsusData: KepsusData = JSON.parse(fileContent);
    
    return json({ kepsusData, error: null });
  } catch (error) {
    console.error('Error loading BSB kepsus data:', error);
    return json({ 
      kepsusData: null, 
      error: 'Gagal memuat data ketentuan khusus BSB. Pastikan file kepsus-bsb-data.json tersedia.' 
    });
  }
}

export default function KepsusBsbPage() {
  const { kepsusData, error } = useLoaderData<typeof loader>();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!kepsusData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Memuat data BSB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Ketentuan Khusus Kawasan BSB
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/kepsus"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md border border-gray-300 hover:border-gray-400"
              >
                Data Trikora
              </Link>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded-md font-medium">
                Data BSB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-6">
        <KepsusFilter data={kepsusData} />
      </main>
    </div>
  );
}