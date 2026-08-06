import api from "./api";

export const getVehicles = () => {
  return api.get("/fleet/");
};

export const getVehicle = (id) => {
  return api.get(`/fleet/${id}`);
};

export const addVehicle = (vehicle) => {
  return api.post("/fleet/", vehicle);
};

export const updateVehicle = (id, vehicle) => {
  return api.put(`/fleet/${id}`, vehicle);
};

export const deleteVehicle = (id) => {
  return api.delete(`/fleet/${id}`);
};