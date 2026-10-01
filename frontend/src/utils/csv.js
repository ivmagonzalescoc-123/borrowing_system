// Builds a CSV from rows + column definitions and downloads it. Values are
// quoted so commas/quotes/newlines in titles or names can't break columns,
// and a leading = + - @ is neutralized so spreadsheet apps don't run it as a
// formula.
function cell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename, columns, rows) {
  const lines = [columns.map((c) => cell(c.label)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => cell(c.value(row))).join(','));
  }
  // BOM so Excel opens UTF-8 (accented names) correctly.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
