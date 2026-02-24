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
      localStorage.setItem("google_token", token);
      login(user, token);
    } catch (error) {
      console.error("Backend Login Error:", error);
      alert("Login failed. Check if your server is running on port 3001!");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-800 text-white">
      <h1 className="text-4xl font-black text-center mb-8">Student PowerUp</h1>

      <div className="bg-white p-8 rounded-2xl shadow-2xl">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          useOneTap={false}
          shape="pill"
          theme="filled_blue"
        />
      </div>

      <p className="mt-8 text-sm text-gray-400">
        By signing in, you agree to our Terms
      </p>
    </div>
  );
};

export default Login;
