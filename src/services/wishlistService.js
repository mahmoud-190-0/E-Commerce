import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getWishlist = () => api.get(ENDPOINTS.WISHLIST.GET);

export const addToWishlist = (productId) =>
  api.post(ENDPOINTS.WISHLIST.ADD(productId));

export const removeFromWishlist = (productId) =>
  api.delete(ENDPOINTS.WISHLIST.REMOVE(productId));

export const clearWishlist = () => api.delete(ENDPOINTS.WISHLIST.CLEAR);
