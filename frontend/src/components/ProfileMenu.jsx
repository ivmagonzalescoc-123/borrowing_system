import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
        <User size={18} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="dropdown-panel profile-panel">
          <div className="profile-info">
            <strong>{user.full_name}</strong>
            <span>{user.id_number}</span>
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
