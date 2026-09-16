import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="dropdown-wrapper" ref={ref}>
      <button className="icon-button avatar-button" onClick={() => setOpen((o) => !o)} aria-label="Profile">
        <span className="avatar-initials">{getInitials(user.full_name)}</span>
      </button>
      {open && (
        <div className="dropdown-panel profile-panel">
          <div className="profile-info">
            <div className="profile-avatar-lg">{getInitials(user.full_name)}</div>
            <div className="profile-text">
              <strong>{user.full_name}</strong>
              <span className="profile-meta">
                <Mail size={12} strokeWidth={1.75} />
                {user.email}
              </span>
            </div>
          </div>
          <button className="dropdown-action logout-action" onClick={handleLogout}>
            <LogOut size={16} strokeWidth={1.75} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
