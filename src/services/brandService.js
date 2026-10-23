import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getBrands = (params) => {
  return api.get(ENDPOINTS.BRANDS.GET_ALL, { params });
};

export const getBrand = (id) => {
  return api.get(ENDPOINTS.BRANDS.GET_ONE(id));
};

export const createBrand = (data) => {
  return api.post(ENDPOINTS.BRANDS.CREATE, data);
};

export const updateBrand = (id, data) => {
  return api.put(ENDPOINTS.BRANDS.UPDATE(id), data);
};

export const deleteBrand = (id) => {
  return api.delete(ENDPOINTS.BRANDS.DELETE(id));
};
