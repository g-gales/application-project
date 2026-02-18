import axios from "axios";

const api = axios.create({
  // TODO: later this will be the Render.com URL
  baseURL: "http://localhost:3001/api/v1",
});

export default api;
