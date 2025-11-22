// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call the auth service, which will save the token and set axios header
      await login(username, password);

      // on success, navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      // Show friendly error message
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 bg-white shadow-md rounded-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            placeholder="Username"
            className="w-full border p-2 rounded mb-3"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded mb-4"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
