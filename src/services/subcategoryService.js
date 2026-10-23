import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

/* -------------------- Subcategories -------------------- */
export const getSubcategories = (categoryId, params) =>
  api.get(ENDPOINTS.SUBCATEGORIES.GET_ALL(categoryId), { params });

export const getSubcategory = (id) =>
  api.get(ENDPOINTS.SUBCATEGORIES.GET_ONE(id));

export const createSubcategory = (categoryId, data) =>
  api.post(ENDPOINTS.SUBCATEGORIES.CREATE(categoryId), data);

export const updateSubcategory = (id, data) =>
  api.put(ENDPOINTS.SUBCATEGORIES.UPDATE(id), data);

export const deleteSubcategory = (id) =>
  api.delete(ENDPOINTS.SUBCATEGORIES.DELETE(id));

/* -------------------- Subcategory products -------------------- */

/**
 * Fetch products for a given subcategory, using the same query-string
 * vocabulary as the backend `ApiFeatures` (filter / search / sort /
 * limitFields / paginate).
 *
 * @param {string} subcategoryId
 * @param {object} [opts]
 * @param {string} [opts.keyword]     // -> ?keyword=
 * @param {string} [opts.sort]        // -> ?sort=-createdAt
 * @param {number} [opts.page]        // -> ?page=
 * @param {number} [opts.limit]       // -> ?limit=
 * @param {string} [opts.fields]      // -> ?fields=name,price
 * @param {object} [opts.filters]     // UI filter shape (see below)
 */
export const getSubcategoryProducts = (
  subcategoryId,
  { keyword, sort, page, limit, fields, filters = {} } = {},
) => {
  const params = {};

  if (keyword) params.keyword = keyword;
  if (sort) params.sort = sort;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (fields) params.fields = fields;

  // ---- map UI filter shape -> ApiFeatures query strings ----
  const { category, brand, minPrice, maxPrice, minRating, inStock } = filters;

  if (category) params.category = category;
  if (brand) params.brand = brand;

  if (minPrice !== "" && minPrice != null) params["price[gte]"] = minPrice;
  if (maxPrice !== "" && maxPrice != null) params["price[lte]"] = maxPrice;

  if (minRating) params["ratingsAverage[gte]"] = minRating;
  if (inStock) params["quantity[gt]"] = 0;

  return api.get(ENDPOINTS.PRODUCTS.BY_SUBCATEGORY(subcategoryId), { params });
};
