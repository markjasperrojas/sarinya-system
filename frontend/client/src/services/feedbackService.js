import API from "../api";

export const submitFeedback = async ({ type, title, message, page }) => {
  const res = await API.post("/feedback", { type, title, message, page });
  return res.data;
};
