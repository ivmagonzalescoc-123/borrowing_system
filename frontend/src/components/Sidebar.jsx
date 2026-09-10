import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, ClipboardList, BookCheck, Bookmark, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const studentLinks = [
  { to: '/student', label: 'Book References Catalog', icon: LayoutGrid, end: true },
  { to: '/student/reservations', label: 'Reservations', icon: ClipboardList },
  { to: '/student/borrowed', label: 'Borrowed Books', icon: BookCheck },
  { to: '/student/bookmarks', label: 'Bookmarks', icon: Bookmark },
];

const staffLinks = [
  { to: '/staff', label: 'Book References Catalog', icon: LayoutGrid, end: true },
  { to: '/staff/reservations', label: 'Reservations', icon: ClipboardList },
  { to: '/staff/borrowed', label: 'Borrowed Books', icon: BookCheck },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

  if (!user) return null;

  const links = user.role === 'staff' ? staffLinks : studentLinks;

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  }

  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        className="sidebar-toggle"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} /> : <PanelLeftClose size={18} strokeWidth={1.75} />}
        <span>Collapse</span>
      </button>
    </aside>
  );
}
