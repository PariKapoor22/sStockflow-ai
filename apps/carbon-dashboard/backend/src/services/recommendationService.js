import api from "./api";

export const getRecommendations = () => {
  return api.get("/recommendation/");
};

export const createRecommendation = (data) => {
  return api.post("/recommendation/", data);
};

export const approveRecommendation = (id) => {
  return api.put(`/recommendation/${id}/approve`);
};

export const rejectRecommendation = (id) => {
  return api.put(`/recommendation/${id}/reject`);
};