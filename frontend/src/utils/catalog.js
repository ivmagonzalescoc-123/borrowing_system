export const SORT_OPTIONS = [
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'available', label: 'Available first' },
  { value: 'newest', label: 'Newest added' },
];

export const PAGE_SIZE = 24;

export function filterBooks(books, { query, category }) {
  const q = query.trim().toLowerCase();
  return books.filter((book) => {
    const matchesQuery =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      (book.isbn || '').toLowerCase().includes(q);
    const matchesCategory = !category || book.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function sortBooks(books, sort) {
  const list = [...books];
  if (sort === 'available') {
    list.sort((a, b) => (b.available_copies > 0) - (a.available_copies > 0) || a.title.localeCompare(b.title));
  } else if (sort === 'newest') {
    list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || b.id - a.id);
  } else {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return list;
}

export function categoriesOf(books) {
  return [...new Set(books.map((b) => b.category).filter(Boolean))].sort();
}
