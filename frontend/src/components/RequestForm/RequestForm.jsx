import { useState } from 'react';
import api from '../../services/api';

function RequestForm({ onRequestCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    category: 'medical',
    description: '',
  });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const res = await api.post('/requests', {
        ...formData,
        longitude: location.longitude,
        latitude: location.latitude,
      });
      setSuccess('Request submitted successfully!');
      setFormData({ name: '', phone: '', category: 'medical', description: '' });
      setLocation(null);
      if (onRequestCreated) onRequestCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
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

      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2 mb-3"
      >
        <option value="medical">Medical</option>
        <option value="food">Food</option>
        <option value="shelter">Shelter</option>
        <option value="rescue">Rescue</option>
      </select>

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