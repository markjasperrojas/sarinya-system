import { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const token = localStorage.getItem("sarinya_token");
    const storedUser = localStorage.getItem("sarinya_user");

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setAuthToken(token);
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem("sarinya_token");
        localStorage.removeItem("sarinya_user");
      }
    }

    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("sarinya_token", token);
    localStorage.setItem("sarinya_user", JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("sarinya_token");
    localStorage.removeItem("sarinya_user");
    setAuthToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem("sarinya_user", JSON.stringify(userData));
    setUser(userData);
  };

  const hasPermission = (module, action) => {
    if (!user) return false;
    // Admins have full access
    if (user.role === "admin") return true;
    // Check specific permission
    return user.permissions?.[module]?.[action] ?? false;
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    hasPermission,
    isAdmin,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
