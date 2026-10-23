import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getProducts = (params) => {
  return api.get(ENDPOINTS.PRODUCTS.GET_ALL, { params });
};

export const getProduct = (id) => {
  return api.get(ENDPOINTS.PRODUCTS.GET_ONE(id));
};

export const createProduct = (data) => {
  return api.post(ENDPOINTS.PRODUCTS.CREATE, data);
};

export const updateProduct = (id, data) => {
  return api.put(ENDPOINTS.PRODUCTS.UPDATE(id), data);
};

export const deleteProduct = (id) => {
  return api.delete(ENDPOINTS.PRODUCTS.DELETE(id));
};
export const createProductReview = (productId, data) =>
  api.post(ENDPOINTS.PRODUCTS.REVIEWS(productId), data);

export const getProductReviews = (productId) => {
  return api.get(ENDPOINTS.PRODUCTS.REVIEWS(productId));
};
