// auth hook needed to pull information of the logged-in user, e.g. username
import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10">
        <div className="flex items-center space-x-4 mb-6">
          {user?.picture && (
            <img
              src={user.picture}
              alt="Profile"
              className="w-16 h-16 rounded-full border-2 border-blue-500"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back, {user?.firstName || "Student"}!
            </h1>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800">
              Dashboard Placeholder
            </h3>
            <p className="text-sm text-blue-600 mt-2">
              Let's get ready to PowerUp!
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-8 text-sm bg-pink-100 p-2 rounded-md font-medium text-red-600 hover:text-red-800 transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
