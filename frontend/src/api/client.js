import axios from "axios";

const api = axios.create({
  baseURL: "https://airy-friendship-production-617b.up.railway.app"
});

export const setAuthToken = (token) => {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export default api;