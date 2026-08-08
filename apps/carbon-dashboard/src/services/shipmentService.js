import api from "./api";

export const getShipments = () => {
  return api.get("/shipments/");
};

export const createShipment = (shipment) => {
  return api.post("/shipments/", shipment);
};

export const deleteShipment = (id) => {
  return api.delete(`/shipments/${id}`);
};