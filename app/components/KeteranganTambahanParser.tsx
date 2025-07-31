import { useState, useMemo } from "react";

interface ParsedKeterangan {
  title: string;
  content: string;
  subcategories: ParsedSubcategory[];
}

interface ParsedSubcategory {
  title: string;
  items: string[];
}

interface KeteranganTambahanParserProps {
  htmlContent: string;
}

// Function to convert text to title case (capitalize first letter of each word)
const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// Function to convert index to letter (0 -> a, 1 -> b, etc.)
const indexToLetter = (index: number): string => {
  return String.fromCharCode(97 + index); // 97 is ASCII code for 'a'
};

export default function KeteranganTambahanParser({ htmlContent }: KeteranganTambahanParserProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [subcategoryCopySuccess, setSubcategoryCopySuccess] = useState<string | null>(null);
  const [hiddenSubcategories, setHiddenSubcategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Parse HTML content to extract Keterangan Tambahan information
  const parsedKeterangan = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find the main title
    const titleElement = tempDiv.querySelector('b');
    const mainTitle = titleElement ? toTitleCase(titleElement.textContent?.trim() || '') : 'Keterangan Tambahan';
    
    // Find the pre element containing the detailed content
    const preElement = tempDiv.querySelector('pre');
    if (!preElement) {
      return { title: mainTitle, content: '', subcategories: [] };
    }
    
    const content = preElement.textContent || '';
    const subcategories: ParsedSubcategory[] = [];
    
    // Parse the content to extract subcategories and their items
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSubcategory: ParsedSubcategory | null = null;
    
    lines.forEach(line => {
      // Check if it's a main subcategory (contains "Ketentuan Khusus")
      if (line.includes('Ketentuan Khusus')) {
        if (currentSubcategory) {
          subcategories.push(currentSubcategory);
        }
        currentSubcategory = {
          title: toTitleCase(line.replace(':', '').trim()),
          items: []
        };
      }
      // Check if it's an item (starts with letter followed by period and colon)
      else if (/^[a-z]\.:/.test(line) && currentSubcategory) {
        // Clean up the item text
        const itemText = line.replace(/^[a-z]\.:/, '').trim();
        if (itemText) {
          currentSubcategory.items.push(toTitleCase(itemText));
        }
      }
      // Handle other content that might be part of the current subcategory
      else if (currentSubcategory && line && !line.includes(':') && line.length > 10) {
        currentSubcategory.items.push(toTitleCase(line));
      }
    });
    
    // Add the last subcategory if it exists
    if (currentSubcategory) {
      subcategories.push(currentSubcategory);
    }
    
    return {
      title: mainTitle,
      content: content,
      subcategories: subcategories
    };
  }, [htmlContent]);

  // Filter subcategories based on search term
  const filteredSubcategories = useMemo(() => {
    if (!searchTerm) return parsedKeterangan.subcategories;
    
    return parsedKeterangan.subcategories.filter(subcategory =>
      subcategory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategory.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [parsedKeterangan.subcategories, searchTerm]);

  const handleCopyAll = async () => {
    try {
      let fullContent = `${parsedKeterangan.title}\n\n`;
      filteredSubcategories.forEach(subcategory => {
        fullContent += `${subcategory.title}\n`;
        subcategory.items.forEach((item, index) => {
          fullContent += `${indexToLetter(index)}. ${item}\n`;
        });
        fullContent += '\n';
      });
      
      await navigator.clipboard.writeText(fullContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCopySubcategory = async (subcategory: ParsedSubcategory) => {
    try {
      let content = `${subcategory.title}\n`;
      subcategory.items.forEach((item, index) => {
        content += `${indexToLetter(index)}. ${item}\n`;
      });
      
      await navigator.clipboard.writeText(content);
      setSubcategoryCopySuccess(subcategory.title);
      setTimeout(() => setSubcategoryCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCopySubcategoryItems = async (subcategory: ParsedSubcategory) => {
    try {
      const itemsList = subcategory.items.join('\n');
      await navigator.clipboard.writeText(itemsList);
      setSubcategoryCopySuccess(`${subcategory.title}-items`);
      setTimeout(() => setSubcategoryCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const toggleSubcategoryVisibility = (subcategoryTitle: string) => {
    setHiddenSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryTitle)) {
        newSet.delete(subcategoryTitle);
      } else {
        newSet.add(subcategoryTitle);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header dengan kontrol */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-5 lg:p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {parsedKeterangan.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredSubcategories.length} kategori ketentuan khusus
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopyAll}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
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
                    Copy All
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Control */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari ketentuan khusus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {filteredSubcategories.map((subcategory) => {
        const isHidden = hiddenSubcategories.has(subcategory.title);
        return (
          <div key={subcategory.title} className="bg-white rounded-lg shadow-sm border p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {subcategory.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSubcategoryVisibility(subcategory.title)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {isHidden ? (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Show
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                      Hide
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCopySubcategoryItems(subcategory)}
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                    subcategoryCopySuccess === `${subcategory.title}-items`
                      ? 'bg-green-50 text-green-700 border-green-300'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {subcategoryCopySuccess === `${subcategory.title}-items` ? (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Items
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCopySubcategory(subcategory)}
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                    subcategoryCopySuccess === subcategory.title
                      ? 'bg-green-50 text-green-700 border-green-300'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {subcategoryCopySuccess === subcategory.title ? (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Copy All
                    </>
                  )}
                </button>
              </div>
            </div>
            {!isHidden && (
              <div className="space-y-3">
                {subcategory.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {indexToLetter(index)}
                    </div>
                    <div className="flex-1 text-gray-900">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {filteredSubcategories.length === 0 && (
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
              Tidak ada ketentuan ditemukan
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {searchTerm
                ? `Tidak ada ketentuan yang cocok dengan pencarian "${searchTerm}"`
                : 'Tidak ada data ketentuan untuk ditampilkan'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}