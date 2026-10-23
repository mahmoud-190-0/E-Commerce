import { useEffect, useState } from "react";
import { X, Package, MapPin, CreditCard } from "lucide-react";
import { getOrder } from "../../services/orderService";
import OrderStatusBadge from "./OrderStatusBadge";
import {
  formatEGP,
  formatOrderDate,
  getItemName,
  getItemPrice,
  getItemQuantity,
  getOrderId,
  getOrderItems,
  getOrderStatus,
  getOrderSubtotal,
  getOrderTotal,
  getPaymentMethod,
  unwrapSingleOrder,
} from "../../Pages/OrdersPage/orderHelpers";

export default function OrderDetailsModal({ order, onClose }) {
  const [details, setDetails] = useState(order);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getOrder(getOrderId(order))
      .then((response) => {
        if (active) setDetails(unwrapSingleOrder(response) || order);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              "We couldn't load the latest order details. Showing available information.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [order]);

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const items = getOrderItems(details);
  const address = details?.shippingAddress || details?.address || {};

  return (
    <div className="orders-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="orders-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
      >
        <header className="orders-modal__header">
          <div>
            <p className="orders-eyebrow">Order details</p>
            <h2 id="order-details-title">#{getOrderId(details).slice(-8).toUpperCase()}</h2>
          </div>
          <button className="orders-icon-button" type="button" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </header>

        <div className="orders-modal__body">
          {loading && <p className="orders-inline-note" role="status">Refreshing order details…</p>}
          {error && <p className="orders-inline-note orders-inline-note--error" role="status">{error}</p>}

          <div className="orders-detail-meta">
            <div>
              <span>Placed on</span>
              <strong>{formatOrderDate(details?.createdAt || details?.orderDate)}</strong>
            </div>
            <div>
              <span>Status</span>
              <OrderStatusBadge status={getOrderStatus(details)} />
            </div>
            <div>
              <span>Payment</span>
              <strong><CreditCard size={15} /> {getPaymentMethod(details)}</strong>
            </div>
          </div>

          <h3 className="orders-section-title"><Package size={18} /> Items in this order</h3>
          {items.length ? (
            <div className="orders-detail-items">
              {items.map((item, index) => (
                <div className="orders-detail-item" key={item?._id || item?.product?._id || index}>
                  <div className="orders-detail-item__avatar" aria-hidden="true">
                    {getItemName(item).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="orders-detail-item__name">
                    <strong>{getItemName(item)}</strong>
                    <span>Qty {getItemQuantity(item)}</span>
                  </div>
                  <strong>{formatEGP(getItemPrice(item) * getItemQuantity(item))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="orders-inline-note">No item details were returned for this order.</p>
          )}

          {(address.street || address.city || address.phone) && (
            <>
              <h3 className="orders-section-title"><MapPin size={18} /> Shipping address</h3>
              <div className="orders-address">
                {[address.street, address.city, address.postalCode, address.country, address.phone]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </>
          )}

          <div className="orders-summary">
            <div><span>Subtotal</span><strong>{formatEGP(getOrderSubtotal(details))}</strong></div>
            <div><span>Total</span><strong className="orders-summary__total">{formatEGP(getOrderTotal(details))}</strong></div>
          </div>
        </div>
      </section>
    </div>
  );
}
