import axios from "axios";

const api = axios.create({
  // TODO: later this will be the Render.com URL
  baseURL: "http://localhost:3001/api/v1",
});

// session management middleware
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log(
    `Axios: Attaching token to ${config.url}:`,
    token ? "✅ Yes" : "❌ No",
  );

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
