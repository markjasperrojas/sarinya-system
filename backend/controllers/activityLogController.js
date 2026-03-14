const ActivityLog = require("../models/ActivityLog");

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
