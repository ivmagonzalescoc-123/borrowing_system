import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const BookmarkContext = createContext(null);

function storageKey(userId) {
  return `bookmarks_${userId}`;
}

export function BookmarkProvider({ children }) {
  const { user } = useAuth();
  const { showSuccess } = useToast();
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  useEffect(() => {
    if (!user) {
      setBookmarkedIds([]);
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey(user.id)) || '[]');
      setBookmarkedIds(stored);
    } catch {
      setBookmarkedIds([]);
    }
  }, [user]);

  function toggleBookmark(bookId) {
    const wasBookmarked = bookmarkedIds.includes(bookId);
    const next = wasBookmarked
      ? bookmarkedIds.filter((id) => id !== bookId)
      : [...bookmarkedIds, bookId];
    setBookmarkedIds(next);
    if (user) {
      localStorage.setItem(storageKey(user.id), JSON.stringify(next));
    }
    showSuccess(wasBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
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
