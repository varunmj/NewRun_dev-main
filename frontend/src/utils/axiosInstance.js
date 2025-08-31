// src/utils/axiosInstance.js
import axios from "axios";
import { navigate } from "../utils/navigate"; // tiny helper below; or use your router hook where you call APIs

// ---- baseURL detection (Vite first) ----
const fromVite =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_API_BASE_URL;

const fromCRA =
  typeof process !== "undefined" &&
  process.env &&
  (process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL);

const API_BASE_URL =
  fromVite ||
  fromCRA ||
  (typeof window !== "undefined" && window.__API_BASE_URL__) ||
  "http://localhost:8000";

// ---- token helpers (read multiple keys defensively) ----
export function getToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    ""
  );
}

export function setToken(jwt) {
  // normalize on one key going forward
  if (jwt) localStorage.setItem("accessToken", jwt);
  // optionally clean up legacy keys
  localStorage.removeItem("token");
  localStorage.removeItem("userToken");
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL.replace(/\/+$/, ""),
  withCredentials: false,
});

// ---- attach Authorization header ----
axiosInstance.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// ---- handle 401 globally (optional but handy) ----
let isHandling401 = false;
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 && !isHandling401) {
      isHandling401 = true;
      // clear token and kick to login once
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("userToken");
      // redirect
      try {
        navigate("/login");
      } finally {
        isHandling401 = false;
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
