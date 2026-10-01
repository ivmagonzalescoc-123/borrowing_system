import { formatDate } from './dateFormat';

// Local "YYYY-MM-DD" for today, matching how the server compares dates.
export function todayString() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

export function addDays(dateString, days) {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function daysBetween(from, to) {
  const [y1, m1, d1] = from.slice(0, 10).split('-').map(Number);
  const [y2, m2, d2] = to.slice(0, 10).split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function isOverdue(record) {
  return record.status === 'borrowed' && Boolean(record.due_date) && record.due_date.slice(0, 10) < todayString();
}

export const ACTIVE_STATUSES = ['reserved', 'borrowed'];
export const CLOSED_RESERVATION_STATUSES = ['cancelled', 'rejected', 'expired'];

// Friendly label + color tone for each lifecycle state. "overdue" is not a
// stored status: it's a borrowed record past its due date.
const STATUS_META = {
  reserved: { label: 'Awaiting pickup', tone: 'reserved' },
  borrowed: { label: 'On loan', tone: 'borrowed' },
  overdue: { label: 'Overdue', tone: 'overdue' },
  returned: { label: 'Returned', tone: 'returned' },
  cancelled: { label: 'Cancelled', tone: 'closed' },
  rejected: { label: 'Declined', tone: 'closed' },
  expired: { label: 'Expired', tone: 'closed' },
};

export function displayStatus(record) {
  return isOverdue(record) ? 'overdue' : record.status;
}

export function statusMeta(record) {
  return STATUS_META[displayStatus(record)] || { label: record.status, tone: 'closed' };
}

// "Due today", "3 days left", "2 days overdue" for a borrowed record.
export function dueText(record) {
  if (!record.due_date) return '';
  const days = daysBetween(todayString(), record.due_date);
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days left`;
}

export function pickupText(record) {
  if (!record.pickup_deadline) return '';
  const days = daysBetween(todayString(), record.pickup_deadline);
  if (days < 0) return 'Pickup window passed';
  if (days === 0) return 'Last day to pick up';
  return `Pick up by ${formatDate(record.pickup_deadline)}`;
}

// Case-insensitive match against the fields staff search by at the desk.
export function matchesRecordQuery(record, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [record.reference_no, record.student_name, record.student_id_number, record.book_title, record.book_author]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(q));
}
