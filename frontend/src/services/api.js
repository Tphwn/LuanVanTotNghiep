import axios from "axios";
import { getLoginRouteFromPath } from "../utils/authPortal";
import { handleAccountLockedResponse } from "../utils/accountLocked";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthRequest = url.includes("/auth/login")
      || url.includes("/auth/register")
      || url.includes("/auth/google")
      || url.includes("/auth/forgot-password")
      || url.includes("/auth/verify-reset-otp")
      || url.includes("/auth/reset-password")
      || url.includes("/auth/resend-otp")
      || url.includes("/auth/verify-register-otp");

    if (!isAuthRequest && handleAccountLockedResponse(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const path = window.location.pathname;
      const isAuthPage = path.startsWith("/login")
        || path.startsWith("/register")
        || path.startsWith("/forgot-password")
        || path === "/partner/login"
        || path === "/partner/forgot-password"
        || path === "/admin/login"
        || path === "/admin/forgot-password";
      if (path !== "/" && !isAuthPage) {
        window.location.href = getLoginRouteFromPath(path);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
