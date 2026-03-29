import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../api";
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const userId = searchParams.get("id");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/reset-password", { userId, token, newPassword });
      setSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Reset failed. The link may be invalid or expired.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
        <div className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-soft border border-gray-100 animate-fade-in text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-danger-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid link</h2>
          <p className="text-gray-500 mb-6">This password reset link is invalid or missing required parameters.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password reset!</h2>
            <p className="text-gray-500 mb-6">
              Your password has been updated successfully. You can now log in with your new password.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <KeyRound className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
              <p className="text-gray-500 mt-1 text-center text-sm">
                Choose a strong password for your account.
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
                label="New password"
                type="password"
                placeholder="At least 6 characters"
                icon={KeyRound}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirm new password"
                type="password"
                placeholder="Repeat your new password"
                icon={KeyRound}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="large"
                className="mt-2"
              >
                Reset password
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
