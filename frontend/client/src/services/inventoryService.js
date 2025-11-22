import API from "../api";

// GET all inventory items
export const getInventoryItems = async () => {
  const res = await API.get("/inventory");
  return res.data;
};

// ADD new item
export const addInventoryItem = async (itemData) => {
  const res = await API.post("/inventory/add", itemData);
  return res.data;
};

// UPDATE item
export const updateInventoryItem = async (id, itemData) => {
  const res = await API.put(`/inventory/update/${id}`, itemData);
  return res.data;
};

// DELETE item
export const deleteInventoryItem = async (id) => {
  const res = await API.delete(`/inventory/delete/${id}`);
  return res.data;
};
