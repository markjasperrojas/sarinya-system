import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { submitFeedback } from "../services/feedbackService";

export default function FeedbackModal({ isOpen, onClose }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    if (loading) return;
    onClose();
    setTimeout(() => {
      setMessage("");
      setError("");
      setSuccess(false);
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError("Please describe your feedback."); return; }

    setError("");
    setLoading(true);
    try {
      await submitFeedback({
        type: "other",
        message,
        page: window.location.pathname,
      });
      setSuccess(true);
      setTimeout(() => handleClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Feedback" size="default">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center animate-scale-in">
          <CheckCircle className="w-12 h-12 text-success-500" />
          <p className="text-lg font-semibold text-gray-800">Thanks for your feedback!</p>
          <p className="text-sm text-gray-500">Your input helps us improve the app.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="input w-full resize-none"
            rows={5}
            placeholder="What's on your mind?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            autoFocus
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-danger-500 shrink-0" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              fullWidth
            >
              Send
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
