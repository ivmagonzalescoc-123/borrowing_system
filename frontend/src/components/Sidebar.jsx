import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentLinks, staffLinks } from '../nav-links';

function readCollapsed() {
  try {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  } catch {
    return false;
  }
}

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebarCollapsed', String(next));
      } catch {
        // Not saved — the sidebar still toggles for this visit.
      }
      return next;
    });
  }, []);

  // Ctrl+B (Cmd+B on Mac) toggles the sidebar, like most editors/dashboards.
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapsed]);

  if (!user) return null;

  const links = user.role === 'staff' ? staffLinks : studentLinks;
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`}>
      {/* Round handle on the sidebar's edge; the chevron flips direction. */}
      <button type="button" className="sidebar-handle" onClick={toggleCollapsed} aria-label={toggleLabel} aria-expanded={!collapsed}>
        <ChevronLeft size={16} strokeWidth={2.5} className="sidebar-handle-icon" />
        <span className="sidebar-handle-tip" aria-hidden="true">
          {collapsed ? 'Expand' : 'Collapse'} <kbd>Ctrl</kbd>+<kbd>B</kbd>
        </span>
      </button>

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
    </aside>
  );
}
