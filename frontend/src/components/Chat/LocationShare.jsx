import { useState, useRef } from 'react';
import socket from '../../services/socket';

function LocationShare({ requestId }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const watchIdRef = useRef(null);

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device');
      return;
    }
    setError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit('update_location', {
          requestId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setError('Failed to get location: ' + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    setSharing(true);
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  };

  return (
    <div className="mt-2 border-t pt-2">
      <button
        onClick={sharing ? stopSharing : startSharing}
        className={`text-xs px-2 py-1 rounded text-white ${
          sharing ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'
        }`}
      >
        {sharing ? 'Stop Sharing Location' : 'Share My Live Location'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default LocationShare;