import { GoogleLogin } from "@react-oauth/google";
import api from "../api/axiosConfig";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      // sending the token to the backend for verification
      const response = await api.post("/users/google-login", {
        token: credentialResponse.credential,
      });

      // getting user and token from backend
      const { user, token } = response.data.data;
      // saving the token pass for user locally
      localStorage.setItem("token", token);
      login(user, token);
    } catch (error) {
      console.error("Backend Login Error:", error);
      alert("Login failed. Check if your server is running on port 3001!");
    }
  };

  const handleGuestLogin = async () => {
    // this mirrors google login, but doesn't handle the Google Token in the backend
    try {
      const response = await api.post("/users/guest-login");

      const { user, token } = response.data.data;

      // we're setting the token the same as in Google Login to ensure it's always overwritten with a fresh login
      localStorage.setItem("token", token);
      login(user, token);
    } catch (error) {
      console.error("Guest Login Error:", error);
      alert("Guest login failed. Make sure the backend is updated!");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-800 text-white">
      <h1 className="text-4xl font-black text-center mb-8">Student PowerUp</h1>

      <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-2xl ">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          useOneTap={false}
          shape="pill"
          theme="filled_blue"
        />
        <button
          onClick={handleGuestLogin}
          className="h-10 w-48 p-2 mt-2 rounded-full text-sm text-white font-bold bg-blue-900 hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
        >
          Guest Sign-In
        </button>
      </div>
    </div>
  );
};

export default Login;
