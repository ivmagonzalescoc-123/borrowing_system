import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentLinks, staffLinks } from '../nav-links';

// The `featured` link (the book catalog) goes in the middle of the bar as a
// larger, raised button; the rest keep their order around it.
function centerFeatured(links) {
  const featured = links.find((link) => link.featured);
  if (!featured) return links;
  const others = links.filter((link) => link !== featured);
  const middle = Math.floor(others.length / 2);
  return [...others.slice(0, middle), featured, ...others.slice(middle)];
}

export default function BottomNav() {
  const { user } = useAuth();

  if (!user) return null;

  const links = centerFeatured(user.role === 'staff' ? staffLinks : studentLinks);

  return (
    <nav className="bottom-nav">
      {links.map(({ to, shortLabel, icon: Icon, end, featured }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-nav-link${featured ? ' is-featured' : ''}${isActive ? ' is-active' : ''}`
          }
        >
          {featured ? (
            <span className="bottom-nav-featured-icon">
              <Icon size={24} strokeWidth={1.9} />
            </span>
          ) : (
            <Icon size={20} strokeWidth={1.75} />
          )}
          <span>{shortLabel}</span>
        </NavLink>
      ))}
    </nav>
  );
}
