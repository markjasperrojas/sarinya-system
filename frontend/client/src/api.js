import axios from "axios";

// Create an axios instance with baseURL pointing to backend
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  // baseURL: "https://betty-noncrusading-averie.ngrok-free.dev/api",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Helper to set or remove the Authorization header (token)
// call setAuthToken(token) after login, and setAuthToken(null) on logout
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

// Catch 401 responses from non-login requests, clear auth, and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("sarinya_token");
      localStorage.removeItem("sarinya_user");
      delete API.defaults.headers.common["Authorization"];

      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== "/") {
        window.location.href = `/?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  },
);

export default API;
