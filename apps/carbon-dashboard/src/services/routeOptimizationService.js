import api from "./api";

export const calculateRoute = (data) => {
  return api.post("/route/calculate", data);
};

export const optimizeRoute = (data) => {
  return api.post("/route/optimize", data);
};