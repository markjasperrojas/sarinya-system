import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import API from "../api";
import { User, Lock, AlertCircle, ChefHat } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const params = new URLSearchParams(location.search);
  const from = location.state?.from || params.get('redirect') || '/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { username, password });
      const { token, user: userData } = res.data;
      login(userData, token);

      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success-100 rounded-full opacity-50 blur-3xl"></div>
      </div>

      <div className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-soft border border-gray-100 animate-fade-in">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ChefHat className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sarinya Restaurant</h1>
          <p className="text-gray-500 mt-1">Inventory & Sales System</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-danger-50 text-danger-700 p-4 rounded-xl mb-6 animate-slide-down">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Username"
            type="text"
            placeholder="Enter your username"
            icon={User}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="large"
            className="mt-6"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-gray-400 text-sm flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Secure access required
          </p>
        </div>
      </div>
    </div>
  );
}
