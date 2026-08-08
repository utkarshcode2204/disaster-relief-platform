import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [matches, setMatches] = useState({});
  const [matchLoading, setMatchLoading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, queueRes, usersRes, incidentsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/priority-queue'),
          api.get('/admin/users'),
          api.get('/admin/incidents'),
        ]);
        setStats(statsRes.data);
        setPriorityQueue(queueRes.data);
        setUsers(usersRes.data);
        setIncidents(incidentsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVerify = async (userId, status) => {
    try {
      await api.patch(`/admin/users/${userId}/verification`, { status });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, verificationStatus: status } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update verification');
    }
  };

  const handleFindMatches = async (incidentId) => {
    setMatchLoading(incidentId);
    try {
      const res = await api.get(`/resources/match/${incidentId}`);
      setMatches((prev) => ({ ...prev, [incidentId]: res.data }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to find matching volunteers');
    } finally {
      setMatchLoading(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="p-6">Loading admin dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">
          Admin Dashboard — {user?.name}
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Map
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold">{stats.totalRequests}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Claimed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.claimed}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Active Incidents (Clustered)</h2>
        <div className="space-y-3">
          {incidents.length === 0 && (
            <p className="text-gray-500 text-sm">No active incidents.</p>
          )}
          {incidents.map((incident) => (
            <div key={incident._id} className="border rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium capitalize">{incident.category}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {incident.requestIds.length} request{incident.requestIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  Max Urgency: {incident.maxUrgencyScore}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                People affected (total): {incident.totalPeopleAffected}
              </p>
              <button
                onClick={() => handleFindMatches(incident._id)}
                disabled={matchLoading === incident._id}
                className="mt-2 text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {matchLoading === incident._id ? 'Searching...' : 'Find Matching Volunteers'}
              </button>

              {matches[incident._id] && (
                <div className="mt-2 border-t pt-2">
                  {matches[incident._id].length === 0 ? (
                    <p className="text-xs text-gray-500">No matching volunteers found.</p>
                  ) : (
                    matches[incident._id].map((v) => (
                      <div key={v._id} className="text-xs text-gray-700 mt-1">
                        <span className="font-medium">{v.name}</span>{' '}
                        ({v.resources.map((r) => `${r.type} x${r.quantity}`).join(', ')})
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Priority Queue</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {priorityQueue.length === 0 && (
              <p className="text-gray-500 text-sm">No pending requests.</p>
            )}
            {priorityQueue.map((req) => (
              <div key={req._id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <span className="font-medium capitalize">{req.category}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    Urgency: {req.aiExtracted?.urgencyScore ?? 0}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                {req.aiExtracted?.peopleAffected != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    People affected: {req.aiExtracted.peopleAffected}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Users</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((u) => (
              <div key={u._id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email} — {u.role}</p>
                  <p className="text-xs mt-1">
                    Status:{' '}
                    <span
                      className={
                        u.verificationStatus === 'verified'
                          ? 'text-green-600'
                          : u.verificationStatus === 'rejected'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }
                    >
                      {u.verificationStatus}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(u._id, 'verified')}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleVerify(u._id, 'rejected')}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;