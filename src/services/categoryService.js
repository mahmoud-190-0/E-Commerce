import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getCategories = (params) => {
  return api.get(ENDPOINTS.CATEGORIES.GET_ALL, { params });
};

export const getCategory = (id) => {
  return api.get(ENDPOINTS.CATEGORIES.GET_ONE(id));
};

export const createCategory = (data) => {
  return api.post(ENDPOINTS.CATEGORIES.CREATE, data);
};

export const updateCategory = (id, data) => {
  return api.put(ENDPOINTS.CATEGORIES.UPDATE(id), data);
};

export const deleteCategory = (id) => {
  return api.delete(ENDPOINTS.CATEGORIES.DELETE(id));
};

export const getCategorySubcategories = (categoryId) => {
  return api.get(ENDPOINTS.CATEGORIES.SUBCATEGORIES(categoryId));
};
