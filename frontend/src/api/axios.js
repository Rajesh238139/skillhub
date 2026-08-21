import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// This module-level variable holds the current access token in memory only.
// It is deliberately NOT persisted to localStorage: localStorage is readable
// by any injected JS (XSS), so a stolen script could exfiltrate a long-lived
// token. Keeping it in memory means a page refresh loses it -- which is why
// App.jsx calls /auth/refresh (using the httpOnly cookie) on load to recover it.
let accessToken = null;
let onUnauthorized = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Don't try to "refresh" a failed refresh call itself, or a failed login.
    const isAuthRoute = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");

    if (status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        // Multiple simultaneous 401s should trigger only ONE refresh call,
        // not one per failed request -- everyone awaits the same promise.
        if (!refreshPromise) {
          refreshPromise = api.post("/auth/refresh").finally(() => {
            refreshPromise = null;
          });
        }
        const { data } = await refreshPromise;
        setAccessToken(data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        onUnauthorized();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
