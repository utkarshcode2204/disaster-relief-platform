import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RESOURCE_TYPES = ['boat', 'vehicle', 'medical_kit', 'food_supplies', 'shelter_space', 'other'];
const ID_TYPES = ['aadhaar', 'passport', 'driving_license', 'voter_id', 'other'];

function MyResources() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [contacts, setContacts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingResources, setSavingResources] = useState(false);
  const [savingId, setSavingId] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const [message, setMessage] = useState({ resources: '', id: '', contacts: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/resources/profile');
        setResources(res.data.resources?.length ? res.data.resources : [{ type: 'boat', quantity: 1, notes: '' }]);
        setVerificationStatus(res.data.verificationStatus || 'unverified');
        if (res.data.idVerification?.idType) setIdType(res.data.idVerification.idType);
        if (res.data.idVerification?.idNumber) setIdNumber(res.data.idVerification.idNumber);
        setContacts(res.data.emergencyContacts?.length ? res.data.emergencyContacts : [{ name: '', phone: '', relation: '' }]);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // --- Resources ---
  const updateResourceRow = (index, field, value) => {
    setResources((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };
  const addResourceRow = () => setResources((prev) => [...prev, { type: 'boat', quantity: 1, notes: '' }]);
  const removeResourceRow = (index) => setResources((prev) => prev.filter((_, i) => i !== index));

  const handleSaveResources = async () => {
    setSavingResources(true);
    setMessage((m) => ({ ...m, resources: '' }));
    try {
      await api.put('/resources/mine', { resources });
      setMessage((m) => ({ ...m, resources: 'Saved!' }));
    } catch (err) {
      setMessage((m) => ({ ...m, resources: err.response?.data?.message || 'Failed to save' }));
    } finally {
      setSavingResources(false);
    }
  };

  // --- ID Verification ---
  const handleSubmitId = async (e) => {
    e.preventDefault();
    setSavingId(true);
    setMessage((m) => ({ ...m, id: '' }));
    try {
      const res = await api.put('/resources/id-verification', { idType, idNumber });
      setVerificationStatus(res.data.verificationStatus);
      setMessage((m) => ({ ...m, id: 'Submitted for review!' }));
    } catch (err) {
      setMessage((m) => ({ ...m, id: err.response?.data?.message || 'Failed to submit' }));
    } finally {
      setSavingId(false);
    }
  };

  // --- Emergency Contacts ---
  const updateContactRow = (index, field, value) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };
  const addContactRow = () => setContacts((prev) => [...prev, { name: '', phone: '', relation: '' }]);
  const removeContactRow = (index) => setContacts((prev) => prev.filter((_, i) => i !== index));

  const handleSaveContacts = async () => {
    setSavingContacts(true);
    setMessage((m) => ({ ...m, contacts: '' }));
    try {
      await api.put('/resources/emergency-contacts', { emergencyContacts: contacts });
      setMessage((m) => ({ ...m, contacts: 'Saved!' }));
    } catch (err) {
      setMessage((m) => ({ ...m, contacts: err.response?.data?.message || 'Failed to save' }));
    } finally {
      setSavingContacts(false);
    }
  };

  const statusColor =
    verificationStatus === 'verified'
      ? 'text-green-600'
      : verificationStatus === 'rejected'
      ? 'text-red-600'
      : verificationStatus === 'pending'
      ? 'text-yellow-600'
      : 'text-gray-500';

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">My Profile</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Resources */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-1">My Resources</h2>
          <p className="text-sm text-gray-500 mb-4">
            Let NGOs and admins know what you have available to help during an emergency.
          </p>
          <div className="space-y-3">
            {resources.map((r, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={r.type}
                  onChange={(e) => updateResourceRow(i, 'type', e.target.value)}
                  className="border rounded px-2 py-2 flex-1"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={r.quantity}
                  onChange={(e) => updateResourceRow(i, 'quantity', Number(e.target.value))}
                  className="border rounded px-2 py-2 w-20"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={r.notes || ''}
                  onChange={(e) => updateResourceRow(i, 'notes', e.target.value)}
                  className="border rounded px-2 py-2 flex-1"
                />
                <button onClick={() => removeResourceRow(i)} className="text-red-500 hover:text-red-700 px-2">✕</button>
              </div>
            ))}
          </div>
          <button onClick={addResourceRow} className="mt-3 text-blue-600 text-sm hover:underline">
            + Add another resource
          </button>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSaveResources}
              disabled={savingResources}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {savingResources ? 'Saving...' : 'Save Resources'}
            </button>
            {message.resources && <span className="text-sm text-gray-600">{message.resources}</span>}
          </div>
        </div>

        {/* ID Verification */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-1">ID Verification</h2>
          <p className="text-sm text-gray-500 mb-1">
            Submit your ID details so admins can verify your identity.
          </p>
          <p className="text-sm mb-4">
            Status: <span className={`font-medium ${statusColor}`}>{verificationStatus}</span>
          </p>
          <form onSubmit={handleSubmitId} className="space-y-3">
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="ID Number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingId}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {savingId ? 'Submitting...' : 'Submit for Verification'}
              </button>
              {message.id && <span className="text-sm text-gray-600">{message.id}</span>}
            </div>
          </form>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-1">Emergency Contacts</h2>
          <p className="text-sm text-gray-500 mb-4">
            People to notify in case of an emergency during a response.
          </p>
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Name"
                  value={c.name}
                  onChange={(e) => updateContactRow(i, 'name', e.target.value)}
                  className="border rounded px-2 py-2 flex-1"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={c.phone}
                  onChange={(e) => updateContactRow(i, 'phone', e.target.value)}
                  className="border rounded px-2 py-2 flex-1"
                />
                <input
                  type="text"
                  placeholder="Relation"
                  value={c.relation}
                  onChange={(e) => updateContactRow(i, 'relation', e.target.value)}
                  className="border rounded px-2 py-2 flex-1"
                />
                <button onClick={() => removeContactRow(i)} className="text-red-500 hover:text-red-700 px-2">✕</button>
              </div>
            ))}
          </div>
          <button onClick={addContactRow} className="mt-3 text-blue-600 text-sm hover:underline">
            + Add another contact
          </button>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSaveContacts}
              disabled={savingContacts}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {savingContacts ? 'Saving...' : 'Save Contacts'}
            </button>
            {message.contacts && <span className="text-sm text-gray-600">{message.contacts}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyResources;