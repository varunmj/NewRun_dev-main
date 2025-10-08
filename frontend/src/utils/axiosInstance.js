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

let API_BASE_URL =
  fromVite ||
  fromCRA ||
  (typeof window !== "undefined" && window.__API_BASE_URL__) ||
  "http://localhost:8000";

// Guardrails: if we’re on production domain without a configured API base, complain loudly.
if (typeof window !== "undefined") {
  const isProdHost = /(^|\.)newrun\.club$/.test(window.location.hostname);
  const isLocalDefault = API_BASE_URL.startsWith("http://localhost");
  if (isProdHost && isLocalDefault) {
    // eslint-disable-next-line no-console
    console.error(
      "[axios] Missing VITE_API_BASE_URL in prod. Refusing to use localhost. " +
      "Set VITE_API_BASE_URL=https://api.newrun.club in Vercel."
    );
    // Optional: fail closed in prod to avoid weird calls to localhost
    // throw new Error("API base misconfigured in production");
  }
}

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
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
    console.log('🔑 Adding auth header to request:', config.url, 'Token:', t.substring(0, 20) + '...');
  } else {
    console.log('❌ No token found for request:', config.url);
  }
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
    
    // Handle 401 Unauthorized
    if (status === 401 && !isHandling401) {
      isHandling401 = true;
      console.warn('401 Unauthorized - clearing tokens and redirecting to login');
      
      // clear token and kick to login once
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("userToken");
      
      // Clear any existing redirect timeout
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      
      // redirect with a small delay to prevent multiple redirects
      redirectTimeout = setTimeout(() => {
        try {
          navigate("/login?error=session_expired");
        } finally {
          isHandling401 = false;
          redirectTimeout = null;
        }
      }, 100);
    }
    
    // Handle 403 Forbidden
    if (status === 403) {
      console.warn('403 Forbidden - insufficient permissions');
    }
    
    // Handle 500 Internal Server Error
    if (status >= 500) {
      console.error('Server error:', errorMessage);
    }
    
    // Enhanced error logging
    console.error('API Error:', {
      status,
      message: errorMessage,
      url: err.config?.url,
      method: err.config?.method,
    });
    
    return Promise.reject(err);
  }
);

export default axiosInstance;
