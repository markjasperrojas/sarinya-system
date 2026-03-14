const Feedback = require("../models/Feedback");
const logActivity = require("../utils/activityLogger");
const AppError = require("../utils/AppError");

// POST /api/feedback — any authenticated user
exports.createFeedback = async (req, res) => {
  const { type, title, message, page } = req.body;

  if (!type) throw new AppError("Feedback type is required", 400);
  if (!title || !title.trim()) throw new AppError("Title is required", 400);
  if (!message || !message.trim()) throw new AppError("Message is required", 400);

  const feedback = await Feedback.create({
    userId: req.user.id,
    username: req.user.username,
    type,
    title: title.trim(),
    message: message.trim(),
    page: page || null,
  });

  logActivity({
    userId: req.user.id,
    action: "add",
    module: "feedback",
    description: `${req.user.username} submitted feedback: "${feedback.title}" (${type})`,
    targetId: feedback._id,
  });

  res.status(201).json({ message: "Feedback submitted successfully!", feedback });
};

// GET /api/feedback — admin only (for future admin UI)
exports.getFeedback = async (req, res) => {
  const { status, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const feedbacks = await Feedback.find(filter)
    .sort({ createdAt: -1 })
    .populate("userId", "username role");

  res.json(feedbacks);
};
