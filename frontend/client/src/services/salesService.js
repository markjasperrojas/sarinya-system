import API from "../api";

export const getRecentSessions = async () => {
  const res = await API.get("/sales/sessions/recent");
  return res.data;
};

export const getSessionDetail = async (sessionId) => {
  const res = await API.get(`/sales/sessions/${sessionId}`);
  return res.data;
};

export const addItemsToSession = async (sessionId, items) => {
  const res = await API.post(`/sales/sessions/${sessionId}/add-items`, { items });
  return res.data;
};

export const removeSessionItem = async (sessionId, saleId) => {
  const res = await API.delete(`/sales/sessions/${sessionId}/remove-item/${saleId}`);
  return res.data;
};
