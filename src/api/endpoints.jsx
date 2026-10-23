export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    FORGOT_PASSWORD: "/auth/forgotPassword",
    VERIFY_CODE: "/auth/verifyResetCode",
    RESEND_RESET_CODE: "/auth/resendResetCode",
    RESET_PASSWORD: "/auth/resetPassword",
  },

  USERS: {
    GET_ME: "/users/getMe",
    UPDATE_ME: "/users/updateMe",
    CHANGE_MY_PASSWORD: "/users/changeMyPassword",
    DELETE_ME: "/users/DeleteMe",

    GET_ALL: "/users",
    GET_ONE: (id) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id) => `/users/${id}`,
    CHANGE_PASSWORD: (id) => `/users/changePassword/${id}`,
    ACTIVATE: (id) => `/users/activate/${id}`,
    DEACTIVATE: (id) => `/users/deactivate/${id}`,
  },

  BRANDS: {
    GET_ALL: "/brands",
    GET_ONE: (id) => `/brands/${id}`,
    CREATE: "/brands",
    UPDATE: (id) => `/brands/${id}`,
    DELETE: (id) => `/brands/${id}`,
  },
  CATEGORIES: {
    GET_ALL: "/categories",
    GET_ONE: (id) => `/categories/${id}`,
    CREATE: "/categories",
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
    SUBCATEGORIES: (categoryId) => `/categories/${categoryId}/subcategories`,
  },
  SUBCATEGORIES: {
    GET_ALL: (categoryId) => `/categories/${categoryId}/subcategories`,
    GET_ONE: (id) => `/subcategories/${id}`,
    CREATE: (categoryId) => `/categories/${categoryId}/subcategories`,
    UPDATE: (id) => `/subcategories/${id}`,
    DELETE: (id) => `/subcategories/${id}`,
    products: (subcategoryId) => `/subcategories/${subcategoryId}/products`,
  },
  PRODUCTS: {
    GET_ALL: "/products",
    GET_ONE: (id) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
    REVIEWS: (productId) => `/products/${productId}/reviews`,
    BY_SUBCATEGORY: (subcategoryId) =>
      `/subcategories/${subcategoryId}/products`,
  },
  CART: { 
    GET: "/cart",
    ADD: "/cart",
    CLEAR: "/cart",
    REMOVE_ITEM: (id) => `/cart/${id}`,
    APPLY_COUPON: "/cart/applyCoupon",

    UPDATE_QUANTITY: (productId) => `/cart/${productId}`,
    REMOVE_COUPON: "/cart/removeCoupon",
  },
  COUPONS: {
    GET_ALL: "/coupons",
    GET_ONE: (id) => `/coupons/${id}`,
    CREATE: "/coupons",
    UPDATE: (id) => `/coupons/${id}`,
    DELETE: (id) => `/coupons/${id}`,
  },

  ORDERS: {
    CREATE_CASH: "/orders",
    GET_ALL: "/orders",
    GET_ONE: (id) => `/orders/${id}`,
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    CHECKOUT: (cartId) => `/orders/checkout-session/${cartId}`,
    WEBHOOK: "/orders/webhook",
  },

  REVIEWS: {
    GET_ONE: (id) => `/reviews/${id}`,
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`,
  },

  ADDRESSES: {
    GET_ALL: "/addresses",
    ADD: "/addresses",
    UPDATE: (id) => `/addresses/${id}`,
    DELETE: (id) => `/addresses/${id}`,
  },

  WISHLIST: {
    GET: "/wishlist",
    ADD: (productId) => `/wishlist/${productId}`,
    REMOVE: (productId) => `/wishlist/${productId}`,
    CLEAR: "/wishlist",
  },
};
