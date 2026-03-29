import API, { setAuthToken } from "../api";

export const login = async (username, password) => {
  // Sends POST /api/auth/login to backend
  const res = await API.post("/auth/login", { username, password });
  // backend returns { message: "...", token: "...", user: {...} }
  const { token, user } = res.data;
  // Save the token and user to localStorage so it persists on refresh
  localStorage.setItem("sarinya_token", token);
  localStorage.setItem("sarinya_user", JSON.stringify(user));
  // Set axios header for future requests
  setAuthToken(token);
  return res.data;
};

export const logout = () => {
  // Remove token and user locally and stop axios from sending it
  localStorage.removeItem("sarinya_token");
  localStorage.removeItem("sarinya_user");
  setAuthToken(null);
};

export const forgotPassword = async (email) => {
  const res = await API.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPassword = async (userId, token, newPassword) => {
  const res = await API.post("/auth/reset-password", { userId, token, newPassword });
  return res.data;
};

export const getStoredUser = () => {
  const storedUser = localStorage.getItem("sarinya_user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      return null;
    }
  }
  return null;
};
