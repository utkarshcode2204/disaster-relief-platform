import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import Chat from '../Chat/Chat';
import LocationShare from '../Chat/LocationShare';
import ResponderLocation from '../Chat/ResponderLocation';

// Fix Leaflet's default marker icons (they break with Vite's bundling)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function RequestMap() {
  const [requests, setRequests] = useState([]);
  const { user } = useAuth();
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

    socket.on('new_request', (newRequest) => {
      setRequests((prev) => [newRequest, ...prev]);
    });

    socket.on('request_updated', (updatedRequest) => {
      setRequests((prev) =>
        prev.map((req) => (req._id === updatedRequest._id ? updatedRequest : req))
      );
    });

    return () => {
      socket.off('new_request');
      socket.off('request_updated');
    };
  }, []);

  const handleClaim = async (id) => {
    try {
      await api.patch(`/requests/${id}/claim`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim request');
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.patch(`/requests/${id}/resolve`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve request');
    }
  };

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
        {requests.map((req) => {
          const isResponder =
            user && req.claimedBy && req.claimedBy === user.id;

          return (
            <Marker
              key={req._id}
              position={[req.location.coordinates[1], req.location.coordinates[0]]}
            >
              <Popup minWidth={220}>
                <strong>{req.category.toUpperCase()}</strong>
                <p>{req.description}</p>
                <p className="text-xs text-gray-500 mb-2">Status: {req.status}</p>

                {user && req.status === 'pending' && (
                  <button
                    onClick={() => handleClaim(req._id)}
                    className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 mr-2"
                  >
                    Claim
                  </button>
                )}

                {user && req.status === 'claimed' && (
                  <button
                    onClick={() => handleResolve(req._id)}
                    className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                )}

                {!user && req.status === 'pending' && (
                  <p className="text-xs text-gray-400 italic">Log in to claim this request</p>
                )}

                {user && req.status === 'claimed' && <Chat requestId={req._id} />}

                {user && req.status === 'claimed' && isResponder && (
                  <LocationShare requestId={req._id} />
                )}

                {user && req.status === 'claimed' && !isResponder && (
                  <ResponderLocation requestId={req._id} />
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default RequestMap;