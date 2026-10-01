import { LayoutDashboard, Library, ClipboardList, BookCheck, Bookmark, Users } from 'lucide-react';

// `featured` marks the catalog: the bottom nav (mobile) puts it in the
// center as a larger raised button, while the sidebar keeps this order.
export const studentLinks = [
  { to: '/student', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/catalog', label: 'Book References Catalog', shortLabel: 'Books', icon: Library, featured: true },
  { to: '/student/reservations', label: 'Reservations', shortLabel: 'Reservations', icon: ClipboardList },
  { to: '/student/borrowed', label: 'Borrowed Books', shortLabel: 'Borrowed', icon: BookCheck },
  { to: '/student/bookmarks', label: 'Bookmarks', shortLabel: 'Bookmarks', icon: Bookmark },
];

export const staffLinks = [
  { to: '/staff', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/catalog', label: 'Book References Catalog', shortLabel: 'Books', icon: Library, featured: true },
  { to: '/staff/reservations', label: 'Reservations', shortLabel: 'Reservations', icon: ClipboardList },
  { to: '/staff/borrowed', label: 'Borrowed Books', shortLabel: 'Borrowed', icon: BookCheck },
  { to: '/staff/students', label: 'Students', shortLabel: 'Students', icon: Users },
];
