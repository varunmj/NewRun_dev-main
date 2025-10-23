// src/utils/axiosInstance.js
import axios from "axios";
import { navigate } from "../utils/navigate"; // tiny helper below; or use your router hook where you call APIs

// ---- baseURL detection (Vite first) ----
const fromViteBaseUrl =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL);

const fromCRA =
  typeof process !== "undefined" &&
  process.env &&
  (process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL);

const defaultFromHost =
  typeof window !== "undefined" && /newrun\.club$/i.test(window.location.hostname)
    ? "https://api.newrun.club"
    : "http://localhost:8000";

const API_BASE_URL =
  fromViteBaseUrl ||
  fromCRA ||
  (typeof window !== "undefined" && window.__API_BASE_URL__) ||
  defaultFromHost;

export const API_BASE_URL_RESOLVED = (API_BASE_URL || defaultFromHost).replace(/\/+$/, "");

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
  baseURL: API_BASE_URL_RESOLVED,
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
let redirectTimeout = null;

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const errorMessage = err?.response?.data?.message || err.message || 'An error occurred';
    const url = err?.config?.url || '';
    const code = err?.response?.data?.code || '';

    // Decide if this 401 should invalidate the session
    // Only clear auth on critical validation routes or explicit token errors
    const isCriticalAuthCall = /\/get-user(\?|$)/.test(url) || /\/auth\/verify/.test(url);
    const isExplicitTokenError = code === 'token_expired' || /jwt/i.test(errorMessage || '');

    if (status === 401 && (isCriticalAuthCall || isExplicitTokenError) && !isHandling401) {
      isHandling401 = true;
      console.warn('401 on critical auth call - clearing tokens and redirecting to login');

      // clear token and kick to login once
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('userToken');
      } catch {}

      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      redirectTimeout = setTimeout(() => {
        try {
          navigate('/login?error=session_expired');
        } finally {
          isHandling401 = false;
          redirectTimeout = null;
        }
      }, 50);
    }

    if (status === 403) {
      console.warn('403 Forbidden - insufficient permissions');
    }

    if (status >= 500) {
      console.error('Server error:', errorMessage);
    }

    // Enhanced error logging
    console.error('API Error:', {
      status,
      message: errorMessage,
      url,
      method: err.config?.method,
    });

    return Promise.reject(err);
  }
);

export default axiosInstance;
