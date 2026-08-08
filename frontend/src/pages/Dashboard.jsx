import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RequestForm from '../components/RequestForm/RequestForm';
import RequestMap from '../components/Map/Map';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">
          Welcome, {user?.name}
        </h1>
       <div className="flex gap-3">
          {user?.role === 'volunteer' && (
            <button
              onClick={() => navigate('/my-resources')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              My Resources
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestForm />
        <RequestMap />
      </div>
    </div>
  );
}

export default Dashboard;