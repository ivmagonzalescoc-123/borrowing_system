import { LayoutGrid, ClipboardList, BookCheck, Bookmark } from 'lucide-react';

export const studentLinks = [
  { to: '/student', label: 'Book References Catalog', shortLabel: 'Catalog', icon: LayoutGrid, end: true },
  { to: '/student/reservations', label: 'Reservations', shortLabel: 'Reservations', icon: ClipboardList },
  { to: '/student/borrowed', label: 'Borrowed Books', shortLabel: 'Borrowed', icon: BookCheck },
  { to: '/student/bookmarks', label: 'Bookmarks', shortLabel: 'Bookmarks', icon: Bookmark },
];

export const staffLinks = [
  { to: '/staff', label: 'Book References Catalog', shortLabel: 'Catalog', icon: LayoutGrid, end: true },
  { to: '/staff/reservations', label: 'Reservations', shortLabel: 'Reservations', icon: ClipboardList },
  { to: '/staff/borrowed', label: 'Borrowed Books', shortLabel: 'Borrowed', icon: BookCheck },
];
