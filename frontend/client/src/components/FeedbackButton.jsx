import { useState } from "react";
import { MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { submitFeedback } from "../services/feedbackService";

const TYPES = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Other" },
];

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("suggestion");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setSuccess(false);
    setError("");
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
    // Reset form after close animation
    setTimeout(() => {
      setTitle("");
      setMessage("");
      setType("suggestion");
      setError("");
      setSuccess(false);
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!message.trim()) { setError("Please describe your feedback."); return; }

    setError("");
    setLoading(true);
    try {
      await submitFeedback({
        type,
        title,
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
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40">
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-30 pointer-events-none" />
        <button
          onClick={handleOpen}
          title="Send Feedback"
          className="relative w-13 h-13 flex items-center justify-center rounded-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          style={{ width: "52px", height: "52px" }}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Feedback Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} title="Send Feedback" size="default">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center animate-scale-in">
            <CheckCircle className="w-12 h-12 text-success-500" />
            <p className="text-lg font-semibold text-gray-800">Thanks for your feedback!</p>
            <p className="text-sm text-gray-500">Your input helps us improve the app.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-danger-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                      ${type === t.value
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-primary-400 hover:text-primary-600"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <Input
              label="Title"
              placeholder="Brief summary of your feedback"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Message <span className="text-danger-500">*</span>
              </label>
              <textarea
                className="input w-full resize-none"
                rows={4}
                placeholder="Describe your feedback in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                required
              />
              <p className="mt-1 text-xs text-gray-400 text-right">{message.length}/1000</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-danger-500 shrink-0" />
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {/* Actions */}
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
                Submit
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
