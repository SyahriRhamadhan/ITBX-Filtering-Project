import { useState, useMemo } from "react";

interface ParsedActivity {
  text: string;
  category: string;
}

interface HtmlActivityParserProps {
  htmlContent: string;
}

// Function to convert text to title case (capitalize first letter of each word)
const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

export default function HtmlActivityParser({
  htmlContent,
}: HtmlActivityParserProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [categoryCopySuccess, setCategoryCopySuccess] = useState<string | null>(
    null
  );
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
    new Set()
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "original">(
    "asc"
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Parse HTML content to extract activities
  const parsedActivities = useMemo(() => {
    const activities: ParsedActivity[] = [];

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Find all elements with class 'itbxList-text'
    const activityElements = tempDiv.querySelectorAll(".itbxList-text");

    // Get category titles
    const categoryElements = tempDiv.querySelectorAll(".itbxListTitle");
    let currentCategory = "Tidak Dikategorikan";

    // Parse the HTML structure
    const allElements = tempDiv.querySelectorAll(".itbxListTitle, .itbxList");

    allElements.forEach((element) => {
      if (element.classList.contains("itbxListTitle")) {
        currentCategory = toTitleCase(
          element.textContent?.trim() || "Tidak Dikategorikan"
        );
      } else if (element.classList.contains("itbxList")) {
        const textElement = element.querySelector(".itbxList-text");
        if (textElement && textElement.textContent) {
          activities.push({
            text: toTitleCase(textElement.textContent.trim()),
            category: currentCategory,
          });
        }
      }
    });

    return activities;
  }, [htmlContent]);

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = parsedActivities.filter(
      (activity) =>
        activity.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortOrder === "asc") {
      filtered = [...filtered].sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortOrder === "desc") {
      filtered = [...filtered].sort((a, b) => b.text.localeCompare(a.text));
    }

    return filtered;
  }, [parsedActivities, searchTerm, sortOrder]);

  // Group activities by category
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ParsedActivity[]> = {};
    filteredAndSortedActivities.forEach((activity) => {
      if (!groups[activity.category]) {
        groups[activity.category] = [];
      }
      groups[activity.category].push(activity);
    });
    return groups;
  }, [filteredAndSortedActivities]);

  const handleCopyList = async () => {
    try {
      const activityList = filteredAndSortedActivities
        .map((activity) => activity.text)
        .join("\n");
      await navigator.clipboard.writeText(activityList);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleCopyByCategory = async () => {
    try {
      let categoryList = "";
      Object.entries(groupedActivities).forEach(([category, activities]) => {
        categoryList += `${category}\n`;
        activities.forEach((activity) => {
          categoryList += `- ${activity.text}\n`;
        });
        categoryList += "\n";
      });
      await navigator.clipboard.writeText(categoryList);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleCopyCategoryList = async (
    category: string,
    activities: ParsedActivity[]
  ) => {
    try {
      const activityList = activities
        .map((activity) => activity.text)
        .join("\n");
      await navigator.clipboard.writeText(activityList);
      setCategoryCopySuccess(category);
      setTimeout(() => setCategoryCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const toggleCategoryVisibility = (category: string) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
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
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Daftar Kegiatan dari HTML
                </h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Total: {filteredAndSortedActivities.length} kegiatan
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {searchTerm
                  ? `Hasil pencarian untuk "${searchTerm}"`
                  : "Semua kegiatan yang tersedia"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopyList}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                  copySuccess
                    ? "bg-green-50 text-green-700 border-green-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {copySuccess ? (
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy List
                  </>
                )}
              </button>
              <button
                onClick={handleCopyByCategory}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
              >
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Copy by Category
              </button>
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari kegiatan atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder("asc")}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  sortOrder === "asc"
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortOrder("desc")}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  sortOrder === "desc"
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Z-A
              </button>
              <button
                onClick={() => setSortOrder("original")}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  sortOrder === "original"
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Original
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activities by Category */}
      {Object.entries(groupedActivities).map(([category, activities]) => {
        const isHidden = hiddenCategories.has(category);
        return (
          <div
            key={category}
            className="bg-white rounded-lg shadow-sm border p-4 sm:p-5 lg:p-6"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {category}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activities.length} kegiatan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCategoryVisibility(category)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {isHidden ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Show
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                      Hide
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCopyCategoryList(category, activities)}
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                    categoryCopySuccess === category
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {categoryCopySuccess === category ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1.5"
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
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            {!isHidden && (
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 text-gray-900">{activity.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {filteredAndSortedActivities.length === 0 && (
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
                : "Tidak ada data kegiatan untuk ditampilkan"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
