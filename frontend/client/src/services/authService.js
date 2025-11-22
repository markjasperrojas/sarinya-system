// src/services/authService.js
import API, { setAuthToken } from "../api";

export const login = async (username, password) => {
  // Sends POST /api/auth/login to backend
  const res = await API.post("/auth/login", { username, password });
  // backend returns { message: "...", token: "..." }
  const { token } = res.data;
  // Save the token to localStorage so it persists on refresh
  localStorage.setItem("sarinya_token", token);
  // Set axios header for future requests
  setAuthToken(token);
  return res.data;
};

export const logout = () => {
  // Remove token locally and stop axios from sending it
  localStorage.removeItem("sarinya_token");
  setAuthToken(null);
};
