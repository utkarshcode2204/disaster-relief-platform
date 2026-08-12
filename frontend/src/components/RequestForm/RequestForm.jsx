import { useState, useEffect } from 'react';
import api from '../../services/api';
import { addToQueue, getQueue, removeFromQueue } from '../../services/offlineQueue';

function RequestForm({ onRequestCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    description: '',
  });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(getQueue().length);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // try syncing on mount too, in case there's a leftover queue from last session
    if (navigator.onLine) syncQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncQueue = async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    for (let i = queue.length - 1; i >= 0; i--) {
      const item = queue[i];
      try {
        const { queuedAt, ...payload } = item;
        await api.post('/requests', payload);
        removeFromQueue(i);
      } catch (err) {
        // stop syncing on first failure, retry later
        break;
      }
    }
    setQueueCount(getQueue().length);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError('');
      },
      () => {
        setError('Unable to retrieve your location. Please allow location access.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!location) {
      setError('Please detect your location before submitting');
      return;
    }

    const payload = {
      ...formData,
      longitude: location.longitude,
      latitude: location.latitude,
    };

    if (!navigator.onLine) {
      addToQueue(payload);
      setQueueCount(getQueue().length);
      setSuccess('You are offline. Request saved and will be sent automatically once you are back online.');
      setFormData({ name: '', phone: '', description: '' });
      setLocation(null);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/requests', payload);
      setSuccess('Request submitted successfully!');
      setFormData({ name: '', phone: '', description: '' });
      setLocation(null);
      if (onRequestCreated) onRequestCreated(res.data);
    } catch (err) {
      // network failed even though navigator.onLine said we're online (flaky connection)
      addToQueue(payload);
      setQueueCount(getQueue().length);
      setSuccess('Could not reach the server. Request saved and will retry automatically.');
      setFormData({ name: '', phone: '', description: '' });
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
    >
      <h3 className="text-xl font-bold mb-4 text-blue-600">Submit a Help Request</h3>

      {!isOnline && (
        <p className="bg-yellow-100 text-yellow-800 text-sm px-3 py-2 rounded mb-3">
          You're offline. Requests will be queued and sent automatically once you're back online.
        </p>
      )}
      {queueCount > 0 && (
        <p className="bg-blue-50 text-blue-700 text-sm px-3 py-2 rounded mb-3">
          {queueCount} request{queueCount !== 1 ? 's' : ''} waiting to sync.
        </p>
      )}

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-3">{success}</p>}
      <input
        type="text"
        name="name"
        placeholder="Your Name (optional)"
        value={formData.name}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <input
        type="text"
        name="phone"
        placeholder="Phone Number (optional)"
        value={formData.phone}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <textarea
        name="description"
        placeholder="Describe the situation..."
        value={formData.description}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-3 h-24"
        required
      />
      <button
        type="button"
        onClick={detectLocation}
        className="w-full bg-gray-200 text-gray-800 py-2 rounded mb-3 hover:bg-gray-300"
      >
        {location ? '📍 Location Detected' : '📍 Detect My Location'}
      </button>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}

export default RequestForm;