import api from "./api";

export const calculateRoute = (data) => {
  return api.post("/route/calculate", data);
};