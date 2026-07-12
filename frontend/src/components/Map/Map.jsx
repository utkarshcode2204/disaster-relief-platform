import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import socket from '../../services/socket';

// Fix Leaflet's default marker icons (they break with Vite's bundling)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function RequestMap() {
  const [requests, setRequests] = useState([]);
  const defaultCenter = [23.2599, 77.4126]; // Bhopal, as a fallback center

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get('/requests');
        setRequests(res.data);
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      }
    };
    fetchRequests();

    // Listen for new requests
    socket.on('new_request', (newRequest) => {
      setRequests((prev) => [newRequest, ...prev]);
    });

    // Listen for status updates (claim/resolve)
    socket.on('request_updated', (updatedRequest) => {
      setRequests((prev) =>
        prev.map((req) => (req._id === updatedRequest._id ? updatedRequest : req))
      );
    });

    // Cleanup listeners when component unmounts
    return () => {
      socket.off('new_request');
      socket.off('request_updated');
    };
  }, []);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {requests.map((req) => (
          <Marker
            key={req._id}
            position={[req.location.coordinates[1], req.location.coordinates[0]]}
          >
            <Popup>
              <strong>{req.category.toUpperCase()}</strong>
              <p>{req.description}</p>
              <p className="text-xs text-gray-500">Status: {req.status}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default RequestMap;