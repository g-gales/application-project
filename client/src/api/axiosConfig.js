import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:3001/api/v1"
    : `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
});

// session management middleware
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
