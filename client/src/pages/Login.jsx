import { GoogleLogin } from "@react-oauth/google";
import api from "../api/axiosConfig";

const Login = () => {
  const handleSuccess = async (credentialResponse) => {
    try {
      // sending the token to the backend for verification and user creation
      const response = await api.post("/users/google-login", {
        token: credentialResponse.credential,
      });

      // TODO: remove alert and console.log, add logic
      console.log("User Data from Backend:", response.data);
      alert(`Welcome, ${response.data.data.user.firstName}!`);

      // TODO: save the user to a "Global State" or "Context" here
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
          useOneTap
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
