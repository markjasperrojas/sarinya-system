import API from "../api";

export const getActivityLogs = async (params = {}) => {
  const res = await API.get("/activity-logs", { params });
  return res.data;
};
