const STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

export default function OrderStatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const label =
    STATUS_LABELS[normalized] ||
    normalized.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span className={"orders-status orders-status--" + normalized}>
      <span className="orders-status__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
