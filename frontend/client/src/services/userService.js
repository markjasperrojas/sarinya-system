import API from "../api";

export const getUsers = async () => {
  const res = await API.get("/users");
  return res.data;
};

export const getUser = async (id) => {
  const res = await API.get(`/users/${id}`);
  return res.data;
};

export const getProfile = async () => {
  const res = await API.get("/users/profile");
  return res.data;
};

export const createUser = async (userData) => {
  const res = await API.post("/users", userData);
  return res.data;
};

export const updateUser = async (id, userData) => {
  const res = await API.put(`/users/${id}`, userData);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await API.delete(`/users/${id}`);
  return res.data;
};
