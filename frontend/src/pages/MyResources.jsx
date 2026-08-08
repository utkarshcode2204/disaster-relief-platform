import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RESOURCE_TYPES = ['boat', 'vehicle', 'medical_kit', 'food_supplies', 'shelter_space', 'other'];

function MyResources() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/resources/mine');
        setResources(res.data.resources.length ? res.data.resources : [{ type: 'boat', quantity: 1, notes: '' }]);
      } catch (err) {
        setMessage('Failed to load resources');
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const updateRow = (index, field, value) => {
    setResources((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () => {
    setResources((prev) => [...prev, { type: 'boat', quantity: 1, notes: '' }]);
  };

  const removeRow = (index) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/resources/mine', { resources });
      setMessage('Saved!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">My Resources</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded shadow p-6 max-w-2xl">
        <p className="text-sm text-gray-500 mb-4">
          Let NGOs and admins know what you have available to help during an emergency.
        </p>

        <div className="space-y-3">
          {resources.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={r.type}
                onChange={(e) => updateRow(i, 'type', e.target.value)}
                className="border rounded px-2 py-2 flex-1"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={r.quantity}
                onChange={(e) => updateRow(i, 'quantity', Number(e.target.value))}
                className="border rounded px-2 py-2 w-20"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={r.notes || ''}
                onChange={(e) => updateRow(i, 'notes', e.target.value)}
                className="border rounded px-2 py-2 flex-1"
              />
              <button
                onClick={() => removeRow(i)}
                className="text-red-500 hover:text-red-700 px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-3 text-blue-600 text-sm hover:underline"
        >
          + Add another resource
        </button>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Resources'}
          </button>
          {message && <span className="text-sm text-gray-600">{message}</span>}
        </div>
      </div>
    </div>
  );
}

export default MyResources;