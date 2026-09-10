import { Link } from 'react-router-dom';
import { BookMarked } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <BookMarked size={22} strokeWidth={1.75} />
        <span>COC Library</span>
      </Link>
      {user && (
        <div className="navbar-links">
          <NotificationBell />
          <ProfileMenu />
        </div>
      )}
    </nav>
  );
}
