import API from "../api";

// GET all inventory items (active only)
export const getInventoryItems = async () => {
  const res = await API.get("/inventory");
  return res.data;
};

// GET pull-out records
export const getPullOuts = async () => {
  const res = await API.get("/inventory/pullouts");
  return res.data;
};

// ADD new item
export const addInventoryItem = async (itemData) => {
  const res = await API.post("/inventory/add", itemData);
  return res.data;
};

// UPDATE item
export const updateInventoryItem = async (id, itemData) => {
  const res = await API.put(`/inventory/${id}`, itemData);
  return res.data;
};

// DELETE item
export const deleteInventoryItem = async (id) => {
  const res = await API.delete(`/inventory/delete/${id}`);
  return res.data;
};

// SELL item
export const sellInventoryItem = async (id, quantity) => {
  const res = await API.post(`/inventory/${id}/sell`, { quantity });
  return res.data;
};

// PULL OUT item
export const pullOutInventoryItem = async (id, data) => {
  const res = await API.post(`/inventory/${id}/pullout`, data);
  return res.data;
};

// BULK SELL (multi-sell POS)
export const bulkSell = async (items) => {
  const res = await API.post("/sales/bulk-sell", { items });
  return res.data;
};
