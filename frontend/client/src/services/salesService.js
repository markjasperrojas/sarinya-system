import API from "../api";

export const getRecentSessions = async () => {
  const res = await API.get("/sales/sessions/recent");
  return res.data;
};

export const getSessionDetail = async (sessionId) => {
  const res = await API.get(`/sales/sessions/${sessionId}`);
  return res.data;
};

export const addItemsToSession = async (sessionId, items, notes) => {
  const res = await API.post(`/sales/sessions/${sessionId}/add-items`, { items, notes });
  return res.data;
};

export const removeSessionItem = async (sessionId, saleId) => {
  const res = await API.delete(`/sales/sessions/${sessionId}/remove-item/${saleId}`);
  return res.data;
};

export const updateSessionItemQty = async (sessionId, productId, quantity) => {
  const res = await API.patch(`/sales/sessions/${sessionId}/update-item-qty`, { productId, quantity });
  return res.data;
};
