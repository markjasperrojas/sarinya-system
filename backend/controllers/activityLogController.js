const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

exports.getActivityLogs = async (req, res) => {
  const { action, module, startDate, endDate, search, page = 1, limit = 20 } = req.query;

  let query = {};

  if (action) {
    query.action = action;
  }

  if (module) {
    query.module = module;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (search) {
    query.description = { $regex: search, $options: "i" };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .populate("userId", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    ActivityLog.countDocuments(query),
  ]);

  res.json({
    logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

exports.getUserActivityReport = async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const matchStage = { userId: require("mongoose").Types.ObjectId.createFromHexString(userId) };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = end;
    }
  }

  const [user, byAction, byModule] = await Promise.all([
    User.findById(userId).select("username role"),
    ActivityLog.aggregate([
      { $match: matchStage },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    ActivityLog.aggregate([
      { $match: matchStage },
      { $group: { _id: "$module", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const totalActions = byAction.reduce((sum, a) => sum + a.count, 0);

  res.json({ user, totalActions, byAction, byModule });
};
