// Plain "YYYY-MM-DD" date helpers. Dates are compared as strings in the
// server's local timezone so "today" means the same thing to every check
// (reservation validation, due dates, overdue sweeps).
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function today() {
  return toDateString(new Date());
}

function addDays(dateString, days) {
  const [y, m, d] = dateString.split('-').map(Number);
  return toDateString(new Date(y, m - 1, d + days));
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function daysBetween(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

// Human-friendly date for notification text, e.g. "Oct 8, 2026".
function formatHuman(dateString) {
  if (!dateString) return '';
  const [y, m, d] = String(dateString).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

module.exports = { toDateString, today, addDays, isValidDateString, daysBetween, formatHuman };
