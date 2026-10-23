export const formatEGP = (value) =>
  new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export const formatOrderDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const getOrderId = (order) =>
  String(order?._id || order?.id || order?.orderId || "");

export const getOrderStatus = (order) =>
  String(order?.status || order?.orderStatus || "pending").toLowerCase();

export const getOrderItems = (order) =>
  order?.cartItems || order?.orderItems || order?.items || order?.products || [];

export const getProductFromOrderItem = (item) =>
  item?.product && typeof item.product === "object"
    ? item.product
    : item?.productId && typeof item.productId === "object"
      ? item.productId
      : item;

export const getItemName = (item) => {
  const product = getProductFromOrderItem(item);
  return product?.title || product?.name || item?.title || "Product";
};

export const getItemPrice = (item) => {
  const product = getProductFromOrderItem(item);
  return Number(
    item?.priceAfterDiscount ??
      item?.price ??
      product?.priceAfterDiscount ??
      product?.price ??
      0,
  );
};

export const getItemQuantity = (item) => Number(item?.quantity) || 1;

export const getOrderSubtotal = (order) =>
  Number(
    order?.totalOrderPriceBeforeDiscount ??
      order?.totalPriceBeforeDiscount ??
      order?.totalPrice ??
      order?.totalOrderPrice ??
      0,
  );

export const getOrderTotal = (order) =>
  Number(
    order?.totalOrderPriceAfterDiscount ??
      order?.totalPriceAfterDiscount ??
      order?.totalOrderPrice ??
      order?.totalPrice ??
      0,
  );

export const getPaymentMethod = (order) => {
  const method =
    order?.paymentMethodType ||
    order?.paymentMethod ||
    order?.paymentMethodTypeLabel;
  if (method) return String(method).replace(/[_-]/g, " ");
  return order?.isPaid ? "Card" : "Cash on delivery";
};

export const unwrapOrderList = (response) => {
  const payload = response?.data?.data;
  const orders = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.orders)
      ? payload.orders
      : Array.isArray(response?.data?.orders)
        ? response.data.orders
        : [];
  const pagination =
    response?.data?.paginationResult ||
    response?.data?.pagination ||
    payload?.paginationResult ||
    {};
  const totalPages = Number(
    pagination.numberOfPages || pagination.totalPages || response?.data?.totalPages,
  );
  return {
    orders,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
};

export const unwrapSingleOrder = (response) =>
  response?.data?.data?.order ||
  response?.data?.data ||
  response?.data?.order ||
  response?.data ||
  null;
