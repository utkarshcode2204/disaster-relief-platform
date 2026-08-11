import { useEffect, useState, useRef } from 'react';
import socket from '../services/socket';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleNotification = (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 20));
    };
    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative bg-white border rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-50"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg  max-h-96 overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="p-3 border-b font-medium text-sm">Notifications</div>
          {notifications.length === 0 ? (
            <p className="p-3 text-xs text-gray-500">No notifications yet.</p>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="p-3 border-b text-xs hover:bg-gray-50">
                <p className="font-medium capitalize">{n.category} — Urgency {n.urgencyScore}</p>
                <p className="text-gray-600 mt-1">{n.message}</p>
                <p className="text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;