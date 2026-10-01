// Library borrowing rules in one place. No fines are charged (school-owned
// reference books), so these limits plus reminders and the overdue block are
// what keep books circulating. Each value can be overridden from .env.
function intFromEnv(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

const policy = {
  // Days after the requested "borrow from" date that a reserved copy is held
  // at the desk before the reservation expires and the copy is released.
  reservationHoldDays: intFromEnv('RESERVATION_HOLD_DAYS', 2),
  // How far ahead a student may reserve (start date), in days from today.
  maxAdvanceDays: intFromEnv('MAX_ADVANCE_DAYS', 30),
  // Loan length used when the student's requested end date has already passed
  // at handover time.
  defaultLoanDays: intFromEnv('DEFAULT_LOAN_DAYS', 7),
  // Longest loan a single reservation (or handover due date) may cover.
  maxLoanDays: intFromEnv('MAX_LOAN_DAYS', 14),
  // Reservations + loans a student may hold at once.
  maxActiveItems: intFromEnv('MAX_ACTIVE_ITEMS', 3),
  // Self-service renewals per loan, and how many days each one adds.
  maxRenewals: intFromEnv('MAX_RENEWALS', 1),
  renewalDays: intFromEnv('RENEWAL_DAYS', 7),
};

module.exports = policy;
