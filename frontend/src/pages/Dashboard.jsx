import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RequestForm from '../components/RequestForm/RequestForm';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRequestCreated = (newRequest) => {
    console.log('New request created:', newRequest);
    // We'll use this to refresh the map/list once those are built
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">
          Welcome, {user?.name}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="flex justify-center">
        <RequestForm onRequestCreated={handleRequestCreated} />
      </div>
    </div>
  );
}

export default Dashboard;