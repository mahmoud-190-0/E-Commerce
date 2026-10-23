import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const createCashOrder = (cartId, data) => {
  return api.post(ENDPOINTS.ORDERS.CREATE_CASH(cartId), data);
};

export const getOrders = (params) => {
  return api.get(ENDPOINTS.ORDERS.GET_ALL, { params });
};

export const getOrder = (id) => {
  return api.get(ENDPOINTS.ORDERS.GET_ONE(id));
};

export const updateOrderStatus = (id, data) => {
  return api.put(ENDPOINTS.ORDERS.UPDATE_STATUS(id), data);
};

export const cancelOrder = (id) => {
  return api.put(ENDPOINTS.ORDERS.CANCEL(id));
};

export const checkoutSession = (cartId, shippingAddress) =>
  api.post(`/orders/checkout-session/${cartId}`, { shippingAddress });
