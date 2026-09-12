import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentLinks, staffLinks } from '../nav-links';

export default function BottomNav() {
  const { user } = useAuth();

  if (!user) return null;

  const links = user.role === 'staff' ? staffLinks : studentLinks;

  return (
    <nav className="bottom-nav">
      {links.map(({ to, shortLabel, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-nav-link${isActive ? ' is-active' : ''}`}
        >
          <Icon size={20} strokeWidth={1.75} />
          <span>{shortLabel}</span>
        </NavLink>
      ))}
    </nav>
  );
}
