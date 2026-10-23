import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getCart = () => {
  return api.get(ENDPOINTS.CART.GET);
};
export const updateCartItemQuantity = (productId, quantity) => {
  return api.patch(ENDPOINTS.CART.UPDATE_QUANTITY(productId), { quantity });
};

export const addToCart = (data) => {
  return api.post(ENDPOINTS.CART.ADD, data);
};

export const clearCart = () => {
  return api.delete(ENDPOINTS.CART.CLEAR);
};

export const removeCartItem = (productId) => {
  return api.delete(ENDPOINTS.CART.REMOVE_ITEM(productId));
};

export const applyCoupon = (data) => {
  return api.put(ENDPOINTS.CART.APPLY_COUPON, data);
};

export const removeCoupon = () => {
  return api.delete(ENDPOINTS.CART.REMOVE_COUPON);
};
