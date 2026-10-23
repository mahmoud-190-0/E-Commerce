import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  Package,
  RefreshCw,
  ShoppingBag,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cancelOrder, getOrders } from "../../services/orderService";
import OrderDetailsModal from "../../Components/Orders/OrderDetailsModal";
import OrderStatusBadge from "../../Components/Orders/OrderStatusBadge";
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
  unwrapOrderList,
} from "./orderHelpers";
import "./OrdersPage.css";

const PAGE_SIZE = 5;
const canCancelOrder = (order) => getOrderStatus(order) === "pending";

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get("page")) || 1));
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState("");
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const toastTimer = useRef(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getOrders({ page, limit: PAGE_SIZE });
      const result = unwrapOrderList(response);
      setOrders(result.orders);
      setTotalPages(result.totalPages);
      if (page > result.totalPages) {
        setPage(result.totalPages);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "We couldn't load your orders. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, refreshKey]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) setLoading(false);
      return;
    }
    loadOrders();
  }, [authLoading, isAuthenticated, loadOrders]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [page, searchParams, setSearchParams]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = async (order) => {
    const id = getOrderId(order);
    if (!id || !canCancelOrder(order) || cancellingId) return;

    const confirmed = window.confirm(
      "Cancel this order? This action cannot be undone.",
    );
    if (!confirmed) return;

    setCancellingId(id);
    try {
      await cancelOrder(id);
      showToast("success", "Your order was cancelled successfully.");
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      showToast(
        "error",
        requestError?.response?.data?.message || "Couldn't cancel this order. Please try again.",
      );
    } finally {
      setCancellingId("");
    }
  };

  if (authLoading) {
    return (
      <main className="orders-page">
        <div className="orders-state" role="status" aria-busy="true">
          <span className="orders-spinner" />
          <p>Checking your account…</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="orders-page">
        <div className="orders-state">
          <div className="orders-state__icon"><Package size={30} /></div>
          <h1>Sign in to view your orders</h1>
          <p>Your order history will be available here after you log in.</p>
          <Link to="/login" state={{ from: "/orders" }} className="orders-button orders-button--primary">
            Sign in <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <header className="orders-page__header">
        <nav className="orders-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">My Orders</span>
        </nav>
        <div className="orders-page__heading">
          <div>
            <p className="orders-eyebrow">Your account</p>
            <h1>My Orders</h1>
            <p className="orders-page__subtitle">Track your purchases and find the details you need.</p>
          </div>
          <button type="button" className="orders-button orders-button--secondary" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
            <RefreshCw size={16} className={loading ? "orders-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {toast && (
        <div className={"orders-toast orders-toast--" + toast.type} role="status" aria-live="polite">
          <span>{toast.type === "success" ? "✓" : "!"}</span>
          <p>{toast.message}</p>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss message"><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <div className="orders-list" aria-busy="true" aria-label="Loading orders">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="orders-skeleton" key={index}>
              <div className="orders-skeleton__line orders-skeleton__line--short" />
              <div className="orders-skeleton__line" />
              <div className="orders-skeleton__line orders-skeleton__line--medium" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="orders-state orders-state--error" role="alert">
          <div className="orders-state__icon"><CircleAlert size={28} /></div>
          <h2>Couldn't load your orders</h2>
          <p>{error}</p>
          <button type="button" className="orders-button orders-button--primary" onClick={() => setRefreshKey((value) => value + 1)}>
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-state">
          <div className="orders-state__icon"><ShoppingBag size={30} /></div>
          <h2>No orders yet</h2>
          <p>Once you place an order, you’ll find its status and details here.</p>
          <Link to="/products" className="orders-button orders-button--primary">Explore products <ArrowRight size={17} /></Link>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => {
              const id = getOrderId(order);
              const items = getOrderItems(order);
              const subtotal = getOrderSubtotal(order);
              const total = getOrderTotal(order);
              const status = getOrderStatus(order);
              const isCancelling = cancellingId === id;

              return (
                <article className="orders-card" key={id}>
                  <div className="orders-card__top">
                    <div className="orders-card__identity">
                      <span className="orders-card__label">Order number</span>
                      <strong>#{id.slice(-8).toUpperCase() || "—"}</strong>
                    </div>
                    <OrderStatusBadge status={status} />
                  </div>

                  <div className="orders-card__meta">
                    <span><CalendarDays size={15} /> {formatOrderDate(order.createdAt || order.orderDate)}</span>
                    <span><Package size={15} /> {items.reduce((sum, item) => sum + getItemQuantity(item), 0)} item(s)</span>
                    <span>{getPaymentMethod(order)}</span>
                  </div>

                  <div className="orders-card__items">
                    {items.slice(0, 3).map((item, index) => (
                      <div className="orders-card-item" key={item?._id || item?.product?._id || index}>
                        <div className="orders-card-item__avatar" aria-hidden="true">{getItemName(item).slice(0, 1).toUpperCase()}</div>
                        <div className="orders-card-item__content">
                          <strong>{getItemName(item)}</strong>
                          <span>Qty {getItemQuantity(item)} · {formatEGP(getItemPrice(item))} each</span>
                        </div>
                        <strong className="orders-card-item__price">{formatEGP(getItemPrice(item) * getItemQuantity(item))}</strong>
                      </div>
                    ))}
                    {items.length > 3 && <p className="orders-card__more">+ {items.length - 3} more item(s)</p>}
                    {items.length === 0 && <p className="orders-card__more">Item details aren’t available in this order summary.</p>}
                  </div>

                  <div className="orders-card__bottom">
                    <div className="orders-total">
                      <span>Total</span>
                      <strong>{formatEGP(total)}</strong>
                      {subtotal > total && <small>Before discount: {formatEGP(subtotal)}</small>}
                    </div>
                    <div className="orders-card__actions">
                      <button type="button" className="orders-button orders-button--secondary" onClick={() => setSelectedOrder(order)}>
                        <Eye size={16} /> Details
                      </button>
                      {canCancelOrder(order) && (
                        <button type="button" className="orders-button orders-button--danger" onClick={() => handleCancel(order)} disabled={Boolean(cancellingId)}>
                          {isCancelling ? <span className="orders-spinner orders-spinner--small" /> : <X size={16} />}
                          {isCancelling ? "Cancelling…" : "Cancel order"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="orders-pagination" aria-label="Orders pagination">
              <button type="button" className="orders-page-button" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                <ChevronLeft size={18} /> Previous
              </button>
              <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
              <button type="button" className="orders-page-button" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
                Next <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </>
      )}

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </main>
  );
}
