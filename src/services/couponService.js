import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getCoupons = (params) => {
  return api.get(ENDPOINTS.COUPONS.GET_ALL, { params });
};

export const getCoupon = (id) => {
  return api.get(ENDPOINTS.COUPONS.GET_ONE(id));
};

export const createCoupon = (data) => {
  return api.post(ENDPOINTS.COUPONS.CREATE, data);
};

export const updateCoupon = (id, data) => {
  return api.put(ENDPOINTS.COUPONS.UPDATE(id), data);
};

export const deleteCoupon = (id) => {
  return api.delete(ENDPOINTS.COUPONS.DELETE(id));
};
