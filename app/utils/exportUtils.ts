interface Activity {
  activity: string;
  zones: Record<string, string>;
}

interface RDTRData {
  activities: Activity[];
  zones: string[];
  regulations: Record<string, string>;
}

export function exportToText(
  activities: Activity[],
  selectedZone: string,
  selectedRegulation: string,
  data: RDTRData
): void {
  let content = `RDTR Filter - Ketentuan Kegiatan dan Penggunaan Lahan\n`;
  content += `Zona: ${selectedZone}\n`;
  if (selectedRegulation) {
    const codes = selectedRegulation.split(',').map(c => c.trim());
    const descriptions = codes.map(code => data.regulations[code] || code);
    content += `Filter: ${selectedRegulation} - ${descriptions.join(' + ')}\n`;
  }
  content += `Total Kegiatan: ${activities.length}\n`;
  content += `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\n\n`;

  content += `DAFTAR KEGIATAN:\n`;
  content += `${'='.repeat(50)}\n\n`;

  activities.forEach((activity, index) => {
    content += `${index + 1}. ${activity.activity}\n`;
    const regulations = activity.zones[selectedZone]?.split(',').map(r => r.trim()) || [];
    content += `   Kode Regulasi: ${regulations.join(', ')}\n`;
    const descriptions = regulations.map(code => data.regulations[code] || code);
    content += `   Keterangan: ${descriptions.join(', ')}\n\n`;
  });

  // Copy to clipboard
  navigator.clipboard.writeText(content).then(() => {
    alert('Data berhasil disalin ke clipboard!');
  }).catch(() => {
    // Fallback: create a textarea and select the text
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Data berhasil disalin ke clipboard!');
  });
}

export function exportToCSV(
  activities: Activity[],
  selectedZone: string,
  selectedRegulation: string,
  data: RDTRData
): void {
  const headers = ['No', 'Kegiatan', 'Kode Regulasi', 'Keterangan'];
  const csvContent = [
    headers.join(','),
    ...activities.map((activity, index) => {
      const regulations = activity.zones[selectedZone]?.split(',').map(r => r.trim()) || [];
      const descriptions = regulations.map(code => data.regulations[code] || code);
      return [
        index + 1,
        `"${activity.activity}"`,
        `"${regulations.join(', ')}"`,
        `"${descriptions.join(', ')}"`
      ].join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `rdtr-filter-${selectedZone}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(
  activities: Activity[],
  selectedZone: string,
  selectedRegulation: string,
  data: RDTRData
): void {
  // For Excel export, we'll create a more detailed CSV that can be opened in Excel
  // In a real implementation, you might want to use a library like xlsx
  const headers = ['No', 'Kegiatan', 'Zona', 'Kode Regulasi', 'Keterangan', 'Tanggal Export'];
  const csvContent = [
    headers.join('\t'), // Use tab separator for better Excel compatibility
    ...activities.map((activity, index) => {
      const regulations = activity.zones[selectedZone]?.split(',').map(r => r.trim()) || [];
      const descriptions = regulations.map(code => data.regulations[code] || code);
      return [
        index + 1,
        activity.activity,
        selectedZone,
        regulations.join(', '),
        descriptions.join(', '),
        new Date().toLocaleDateString('id-ID')
      ].join('\t');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `rdtr-filter-${selectedZone}-${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}