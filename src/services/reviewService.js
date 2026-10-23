import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getReview = (id) => {
  return api.get(ENDPOINTS.REVIEWS.GET_ONE(id));
};

export const updateReview = (id, data) => {
  return api.put(ENDPOINTS.REVIEWS.UPDATE(id), data);
};

export const deleteReview = (id) => {
  return api.delete(ENDPOINTS.REVIEWS.DELETE(id));
};
