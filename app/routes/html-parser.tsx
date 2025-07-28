import { useState } from "react";
import { Link } from "@remix-run/react";
import HtmlActivityParser from "~/components/HtmlActivityParser";

export default function HtmlParser() {
  const [htmlContent, setHtmlContent] = useState('');
  const [showParsedContent, setShowParsedContent] = useState(false);

  // Default HTML content dari catatan.txt
  const defaultHtmlContent = `<div class="activitiesArea"><div><div class="v-input v-input--hide-details v-input--dense theme--light v-text-field v-text-field--is-booted v-text-field--enclosed v-text-field--outlined v-text-field--placeholder" style="font-size: 0.9em;"><div class="v-input__control"><div class="v-input__slot"><div class="v-input__prepend-inner"><i aria-hidden="true" class="v-icon notranslate mdi mdi-magnify theme--light"></i></div><fieldset aria-hidden="true"><legend style="width: 0px;"><span class="notranslate">​</span></legend></fieldset><div class="v-text-field__slot"><input id="input-118" placeholder="Cari kegiatan" type="text"></div></div></div></div></div> <!----> <div class="mt-4"><div class="itbxListTitle">KEGIATAN DIIZINKAN</div> <div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pengusahaan perbenihan tanaman kehutanan</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div></div> <!----> <div class="mt-4"><div class="itbxListTitle">KEGIATAN BERSYARAT</div> <div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkaran ikan dan coral/karang</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pemanfaatan hasil hutan bukan kayu</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan pisces/ikan bersirip di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan crustacea di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan mollusca di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan/pengambilan tumbuhan air di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan/pengambilan induk/benih ikan di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan echinodermata di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan coelenterata di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan ikan hias laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan biota air lainnya di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan pisces/ikan bersirip di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan crustacea di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan mollusca di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan/pengambilan tumbuhan air di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan/pengambilan induk/benih ikan di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan ikan hias di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan biota air lainnya di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran pisces/ikan bersirip laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembenihan ikan laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya ikan hias air laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya karang (coral)</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran mollusca laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran crustacea laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran tumbuhan air laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya biota air laut lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran ikan air tawar di kolam</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran ikan air tawar di karamba jaring apung</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran ikan air tawar di karamba</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya ikan hias air tawar</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembenihan ikan air tawar</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran ikan air tawar di karamba jaring tancap</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya ikan air tawar di media lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran pisces/ikan bersirip air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembenihan ikan air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran mollusca air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran crustacea air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran tumbuhan air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya biota air payau lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">transmisi tenaga listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">distribusi tenaga listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pengoperasian instalasi penyediaan tenaga listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pengoperasian instalasi pemanfaatan tenaga listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi bangunan sipil jembatan, jalan layang, fly over dan underpass</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi jalan rel</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi jaringan irigasi dan drainase</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi bangunan sipil telekomunikasi untuk prasarana transportasi</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi sentral telekomunikasi</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi jaringan irigasi, komunikasi dan limbah lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi bangunan prasarana sumber daya air</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi reservoir pembangkit listrik tenaga air</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penyiapan lahan</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi telekomunikasi</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">jasa instalasi konstruksi navigasi laut, sungai, dan udara</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi sinyal dan telekomunikasi kereta api</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi sinyal dan rambu-rambu jalan raya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi saluran air (plambing)</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel untuk penumpang</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel untuk barang</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel perkotaan</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel wisata</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">aktivitas cold storage</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penelitian dan pengembangan ilmu pengetahuan alam</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penelitian dan pengembangan teknologi dan rekayasa</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penelitian dan pengembangan ilmu kedokteran</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div></div>`;

  const handleLoadDefault = () => {
    setHtmlContent(defaultHtmlContent);
    setShowParsedContent(true);
  };

  const handleParseHtml = () => {
    if (htmlContent.trim()) {
      setShowParsedContent(true);
    }
  };

  const handleClearAll = () => {
    setHtmlContent('');
    setShowParsedContent(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header with Navigation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke RDTR Filter
                </Link>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              HTML Activity Parser
            </h1>
            <p className="text-gray-600">
              Paste HTML content untuk mengekstrak dan menampilkan daftar kegiatan dengan fitur copy dan sorting.
            </p>
          </div>

          {/* Form Input */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Input HTML Content
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleLoadDefault}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load Sample Data
                  </button>
                  <button
                    onClick={handleParseHtml}
                    disabled={!htmlContent.trim()}
                    className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Parse HTML
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="html-content" className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content
                </label>
                <textarea
                  id="html-content"
                  rows={12}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Paste your HTML content here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {htmlContent.length} characters
                </span>
                <span>
                  Tip: Paste HTML yang mengandung class "itbxList-text" dan "itbxListTitle"
                </span>
              </div>
            </div>
          </div>

          {/* Parsed Content */}
          {showParsedContent && htmlContent && (
            <HtmlActivityParser htmlContent={htmlContent} />
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Cara Penggunaan
            </h3>
            <div className="space-y-2 text-blue-800">
              <p>• <strong>Load Sample Data:</strong> Memuat contoh data HTML dari catatan.txt</p>
              <p>• <strong>Paste HTML:</strong> Copy-paste HTML content ke textarea</p>
              <p>• <strong>Parse HTML:</strong> Klik tombol untuk mengekstrak daftar kegiatan</p>
              <p>• <strong>Copy List:</strong> Copy semua nama kegiatan dalam format list</p>
              <p>• <strong>Copy by Category:</strong> Copy kegiatan yang dikelompokkan berdasarkan kategori</p>
              <p>• <strong>Sorting:</strong> Urutkan A-Z, Z-A, atau urutan asli</p>
              <p>• <strong>Search:</strong> Cari kegiatan atau kategori tertentu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}