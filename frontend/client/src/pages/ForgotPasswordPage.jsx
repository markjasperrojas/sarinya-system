import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
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
        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 mb-6">
              If an account with that email exists, we've sent a password reset link. Check your inbox and follow the instructions.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
              <p className="text-gray-500 mt-1 text-center text-sm">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 bg-danger-50 text-danger-700 p-4 rounded-xl mb-6 animate-slide-down">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="large"
                className="mt-2"
              >
                Send reset link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
