// 1. Responsabilité : Helpers purs pour la génération et le téléchargement de fichiers CSV
// 2. Dépendances clés : aucune
// 3. Mots-clés métier : csv_export, download, formatting, attendance_sheet, links_export

export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '').replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(';')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
