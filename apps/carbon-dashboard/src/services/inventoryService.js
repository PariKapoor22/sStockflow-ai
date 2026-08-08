import api from "./api";

export const getInventory = () => {
  return api.get("/inventory/");
};

export const addInventory = (item) => {
  return api.post("/inventory/", item);
};

export const updateInventory = (id, item) => {
  return api.put(`/inventory/${id}`, item);
};

export const deleteInventory = (id) => {
  return api.delete(`/inventory/${id}`);
};