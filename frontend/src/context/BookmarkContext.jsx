import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const BookmarkContext = createContext(null);

// Bookmarks live on the server so they follow the student across devices
// and browsers. Toggles update the UI immediately and roll back on failure.
export function BookmarkProvider({ children }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  useEffect(() => {
    if (user?.role !== 'student') {
      setBookmarkedIds([]);
      return;
    }
    let cancelled = false;
    api
      .get('/books/bookmarks')
      .then((res) => {
        if (!cancelled) setBookmarkedIds(res.data.bookIds);
      })
      .catch(() => {
        if (!cancelled) setBookmarkedIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function toggleBookmark(bookId) {
    const wasBookmarked = bookmarkedIds.includes(bookId);
    setBookmarkedIds((prev) => (wasBookmarked ? prev.filter((id) => id !== bookId) : [bookId, ...prev]));
    try {
      if (wasBookmarked) await api.delete(`/books/${bookId}/bookmark`);
      else await api.put(`/books/${bookId}/bookmark`);
      showSuccess(wasBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch {
      setBookmarkedIds((prev) => (wasBookmarked ? [bookId, ...prev] : prev.filter((id) => id !== bookId)));
      showError("Couldn't update your bookmarks. Try again.");
    }
  }

  function isBookmarked(bookId) {
    return bookmarkedIds.includes(bookId);
  }

  return (
    <BookmarkContext.Provider value={{ bookmarkedIds, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within a BookmarkProvider');
  return ctx;
}
