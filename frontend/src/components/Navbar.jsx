import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/assets/img/logo.png" alt="" className="navbar-logo" />
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
