import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080"
});

export const setAuthToken = (token) => {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export default api;
