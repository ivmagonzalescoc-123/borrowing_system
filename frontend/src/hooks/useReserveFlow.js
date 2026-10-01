import { useState } from 'react';
import api from '../api/axios';
import { formatDate, formatTime } from '../utils/dateFormat';
import { useConfirm } from '../context/ConfirmContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';

// Open-book → reserve → success flow shared by the catalog and bookmarks
// pages, plus joining/leaving a book's waitlist. `onChanged` reloads
// whatever lists the page shows after a reservation or waitlist change.
export default function useReserveFlow({ onChanged }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [reservationResult, setReservationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [waitlistBusy, setWaitlistBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const { reload: reloadNotifications } = useNotifications();
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();

  function openBook(book) {
    setFormError('');
    setSelectedBook(book);
  }

  async function submitReservation(payload) {
    const details = [
      ['Book', selectedBook?.title],
      ['Purpose', payload.purpose],
      ['Borrow', `${formatDate(payload.requestStartDate)} – ${formatDate(payload.requestEndDate)}`],
    ];
    if (payload.requestTime) details.push(['Return time', formatTime(payload.requestTime)]);
    const ok = await confirm({
      title: 'Reserve this book?',
      message: "A copy will be held for you. Pick it up at the library desk before the pickup deadline.",
      details,
      confirmLabel: 'Reserve',
    });
    if (!ok) return;

    setSubmitting(true);
    setFormError('');
    try {
      const res = await api.post('/borrows', payload, {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      });
      setSelectedBook(null);
      setReservationResult(res.data.record);
      showSuccess('Book reserved successfully');
      reloadNotifications();
      onChanged?.();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reserve book';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleWaitlist(book) {
    setWaitlistBusy(true);
    try {
      if (book.waitlisted) await api.delete(`/books/${book.id}/waitlist`);
      else await api.put(`/books/${book.id}/waitlist`);
      const waitlisted = !book.waitlisted;
      setSelectedBook((current) => (current?.id === book.id ? { ...current, waitlisted } : current));
      showSuccess(waitlisted ? "You're on the waitlist" : 'Removed from waitlist');
      onChanged?.();
    } catch (err) {
      showError(err.response?.data?.message || "Couldn't update the waitlist");
    } finally {
      setWaitlistBusy(false);
    }
  }

  return {
    selectedBook,
    openBook,
    closeBook: () => setSelectedBook(null),
    submitReservation,
    submitting,
    formError,
    reservationResult,
    closeResult: () => setReservationResult(null),
    toggleWaitlist,
    waitlistBusy,
  };
}
