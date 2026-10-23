import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getAddresses = () => {
  return api.get(ENDPOINTS.ADDRESSES.GET_ALL);
};

export const addAddress = (data) => {
  return api.post(ENDPOINTS.ADDRESSES.ADD, data);
};

export const updateAddress = (id, data) => {
  return api.put(ENDPOINTS.ADDRESSES.UPDATE(id), data);
};

export const deleteAddress = (id) => {
  return api.delete(ENDPOINTS.ADDRESSES.DELETE(id));
};
