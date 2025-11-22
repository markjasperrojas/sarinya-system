// src/api.js
import axios from "axios";

// Create an axios instance with baseURL pointing to backend
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
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

export default API;
