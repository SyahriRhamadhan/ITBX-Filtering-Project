import { useState } from "react";
import { Link } from "@remix-run/react";
import HtmlActivityParser from "~/components/HtmlActivityParser";

export default function HtmlParser() {
  const [htmlContent, setHtmlContent] = useState('');
  const [showParsedContent, setShowParsedContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'keterangan'>('activities');
  const [keteranganContent, setKeteranganContent] = useState('');

  // Default HTML content dari catatan.txt
  const defaultHtmlContent = `<div class="activitiesArea"><div><div class="v-input v-input--hide-details v-input--dense theme--light v-text-field v-text-field--is-booted v-text-field--enclosed v-text-field--outlined v-text-field--placeholder" style="font-size: 0.9em;"><div class="v-input__control"><div class="v-input__slot"><div class="v-input__prepend-inner"><i aria-hidden="true" class="v-icon notranslate mdi mdi-magnify theme--light"></i></div><fieldset aria-hidden="true"><legend style="width: 0px;"><span class="notranslate">​</span></legend></fieldset><div class="v-text-field__slot"><input id="input-118" placeholder="Cari kegiatan" type="text"></div></div></div></div></div> <!----> <div class="mt-4"><div class="itbxListTitle">KEGIATAN DIIZINKAN</div> <div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pengusahaan perbenihan tanaman kehutanan</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div></div> <!----> <div class="mt-4"><div class="itbxListTitle">KEGIATAN BERSYARAT</div> <div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkaran ikan dan coral/karang</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pemanfaatan hasil hutan bukan kayu</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan pisces/ikan bersirip di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan crustacea di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan mollusca di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan/pengambilan tumbuhan air di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan/pengambilan induk/benih ikan di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan echinodermata di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan coelenterata di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan ikan hias laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan biota air lainnya di laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan pisces/ikan bersirip di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan crustacea di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan mollusca di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan/pengambilan tumbuhan air di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan/pengambilan induk/benih ikan di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan ikan hias di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penangkapan biota air lainnya di perairan darat</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran pisces/ikan bersirip laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembenihan ikan laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya ikan hias air laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya karang (coral)</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran mollusca laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran crustacea laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran tumbuhan air laut</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya biota air laut lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran ikan air tawar di kolam</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran ikan air tawar di karamba jaring apung</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran ikan air tawar di karamba</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya ikan hias air tawar</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembenihan ikan air tawar</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran ikan air tawar di karamba jaring tancap</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya ikan air tawar di media lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran pisces/ikan bersirip air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembenihan ikan air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran mollusca air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran crustacea air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pembesaran tumbuhan air payau</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">budidaya biota air payau lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">transmisi tenaga listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">distribusi tenaga listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pengoperasian instalasi penyediaan tenaga listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">pengoperasian instalasi pemanfaatan tenaga listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi bangunan sipil jembatan, jalan layang, fly over dan underpass</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi jalan rel</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi jaringan irigasi dan drainase</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi bangunan sipil telekomunikasi untuk prasarana transportasi</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi sentral telekomunikasi</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi jaringan irigasi, komunikasi dan limbah lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi bangunan prasarana sumber daya air</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">konstruksi reservoir pembangkit listrik tenaga air</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penyiapan lahan</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi listrik</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi telekomunikasi</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">jasa instalasi konstruksi navigasi laut, sungai, dan udara</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi sinyal dan telekomunikasi kereta api</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi sinyal dan rambu-rambu jalan raya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">instalasi saluran air (plambing)</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel untuk penumpang</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel untuk barang</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel perkotaan</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel wisata</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">angkutan jalan rel lainnya</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">aktivitas cold storage</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penelitian dan pengembangan ilmu pengetahuan alam</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penelitian dan pengembangan teknologi dan rekayasa</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div><div class="itbxList py-1"><div class="d-flex justify-space-between"><div class="itbxList-text">penelitian dan pengembangan ilmu kedokteran</div> <button type="button" class="v-icon notranslate v-icon--link mdi mdi-information theme--light" style="font-size: 16px;"></button></div></div></div>`;

  // Default Keterangan Tambahan content
  const defaultKeteranganContent = `
    <div class="keteranganArea">
      <div class="mt-4">
        <div class="itbxListTitle">Keterangan Tambahan</div>
        
        <div class="mt-3">
          <div class="font-weight-bold mb-2">Ketentuan Khusus Kawasan Rawan Bencana:</div>
          
          <div class="ml-3 mb-3">
            <div class="font-weight-medium mb-1">Ketentuan Khusus Rawan Cuaca Ekstrim Tingkat Tinggi:</div>
            <div class="ml-3">
              <div class="mb-1">a. Struktur dan konstruksi bangunan harus mempunyai ikatan yang baik sehingga dapat menahan kerangka mapun penutup atap untuk tetap pada posisinya; dan</div>
              <div class="mb-1">b. Menghindari pemakaian kaca lebar untuk jendela; Pemantauan Cuaca dan Peringatan Dini.</div>
            </div>
          </div>
        </div>
        
        <div class="mt-4">
          <div class="font-weight-bold mb-2">Ketentuan Khusus Kawasan Sempadan:</div>
          
          <div class="ml-3 mb-3">
            <div class="font-weight-medium mb-1">Sempadan Pantai:</div>
            <div class="ml-3">
              <div class="mb-1">a. Penyediaan akses jalan publik ke area pantai yang berfungsi juga sebagai jalan inspeksi;</div>
              <div class="mb-1">b. Penyediaan fasilitas pejalan kaki dan penyandang disabilitas dengan lebar minimal 1,5 meter untuk persil yang menghadap pantai;</div>
              <div class="mb-1">c. Tinggi bangunan kegiatan pariwisata maksimal adalah 9 meter untuk bangunan baru dengan syarat menambahkan fasilitas pengamanan pantai;</div>
              <div class="mb-1">d. Tinggi bangunan untuk kegiatan lain mengacu kepada ketentuan tata bangunan;</div>
              <div class="mb-1">e. Tinggi pagar yang berada di pinggir Pantai dan menghadap jalan maksimal adalah 1,5 meter dengan menggunakan jenis pagar yang tidak menghalangi pemandangan ke pantai; dan</div>
              <div class="mb-1">g. Bangunan yang diperbolehkan adalah bangunan tidak permanen.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const handleLoadDefault = () => {
    setHtmlContent(defaultHtmlContent);
    setKeteranganContent(defaultKeteranganContent);
    setShowParsedContent(true);
  };

  const handleLoadKeteranganDefault = () => {
    setKeteranganContent(defaultKeteranganContent);
    setActiveTab('keterangan');
    setShowParsedContent(true);
  };

  // Fungsi untuk copy keterangan tambahan ke clipboard dalam format Excel
  const handleCopyKeteranganToExcel = () => {
    if (!keteranganContent.trim()) return;
    
    // Parse HTML dan convert ke text format yang Excel-friendly
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = normalizeListMarkers(keteranganContent);
    
    // Extract text content dan format untuk Excel
    let textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up dan format untuk Excel
    textContent = textContent
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^\s+|\s+$/g, '') // Trim start and end
      .replace(/([a-z]\.\s)/g, '\n$1') // Add line break before list items
      .replace(/([A-Z][^:]*:)/g, '\n$1\n') // Add line breaks around headings
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    navigator.clipboard.writeText(textContent).then(() => {
      alert('Keterangan tambahan berhasil di-copy! Sekarang bisa di-paste ke Excel.');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Gagal copy ke clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HTML Parser</h1>
              <p className="text-gray-600 mt-1">Parse HTML content untuk kegiatan dan keterangan tambahan</p>
            </div>
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Kembali ke Filter
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Parser Kegiatan
              </button>
              <button
                onClick={() => setActiveTab('keterangan')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'keterangan'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Parser Keterangan Tambahan
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'activities' ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="html-content" className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Content untuk Kegiatan
                    </label>
                    <textarea
                      id="html-content"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      placeholder="Paste HTML content di sini..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleLoadDefault}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Load Sample Data
                  </button>
                  <button
                    onClick={() => setShowParsedContent(true)}
                    disabled={!htmlContent.trim()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Parse Content
                  </button>
                  <button
                    onClick={() => {
                      setHtmlContent('');
                      setShowParsedContent(false);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="keterangan-content" className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Content untuk Keterangan Tambahan
                    </label>
                    <textarea
                      id="keterangan-content"
                      value={keteranganContent}
                      onChange={(e) => setKeteranganContent(e.target.value)}
                      placeholder="Paste HTML content untuk keterangan tambahan di sini..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleLoadKeteranganDefault}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Load Sample Data
                  </button>
                  <button
                    onClick={() => setShowParsedContent(true)}
                    disabled={!keteranganContent.trim()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Parse Content
                  </button>
                  <button
                    onClick={() => {
                      setKeteranganContent('');
                      setShowParsedContent(false);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parsed Content */}
        {showParsedContent && (
          <div className="mt-6">
            {activeTab === 'activities' && htmlContent.trim() && (
              <HtmlActivityParser htmlContent={htmlContent} />
            )}
            {activeTab === 'keterangan' && keteranganContent.trim() && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Keterangan Tambahan</h3>
                  <button
                    onClick={handleCopyKeteranganToExcel}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    📋 Copy untuk Excel
                  </button>
                </div>
                <div className="p-6">
                  <div 
                    className="text-gray-900 leading-relaxed" 
                    style={{ color: '#1f2937' }}
                    dangerouslySetInnerHTML={{ 
                      __html: normalizeListMarkers(keteranganContent) 
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Fungsi untuk menormalkan list markers dari a.: menjadi a.
function normalizeListMarkers(html: string): string {
  // Replace list markers like "a.:" with "a." but preserve colons in headings
  return html.replace(/\b([a-z])\.\:/g, "$1.");
}