import { useEffect, useState } from 'react';
import socket from '../../services/socket';

function ResponderLocation({ requestId }) {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const handleLocation = (data) => {
      setLocation(data);
    };
    socket.on('responder_location', handleLocation);

    return () => {
      socket.off('responder_location', handleLocation);
    };
  }, [requestId]);

  if (!location) return null;

  return (
    <div className="mt-2 border-t pt-2">
      <p className="text-xs text-gray-600">
        📍 Responder's live position: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
      </p>
    </div>
  );
}

export default ResponderLocation;