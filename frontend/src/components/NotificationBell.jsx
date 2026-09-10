import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle() {
    setOpen((o) => !o);
    if (!open) markAllRead();
  }

  return (
    <div className="dropdown-wrapper" ref={ref}>
      <button className="icon-button" onClick={toggle} aria-label="Notifications">
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && <span className="badge-dot" />}
      </button>
      {open && (
        <div className="dropdown-panel notification-panel">
          {notifications.length === 0 ? (
            <p className="dropdown-empty">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="notification-item">
                <p>{n.message}</p>
                <span>{timeAgo(n.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
