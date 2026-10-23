import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { checkoutSession } from "../../services/orderService";
import {
  applyCoupon,
  clearCart,
  removeCartItem,
  removeCoupon,
  updateCartItemQuantity,
} from "../../services/cartService";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import "./cartpage.css";

const money = (value) => `$${(Number(value) || 0).toFixed(2)}`;

const apiMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const EMPTY_ADDRESS = {
  street: "",
  city: "",
  postalCode: "",
  country: "EG",
  phone: "",
};

export default function CartPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { cart, cartItems, refreshCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [couponName, setCouponName] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

  // ---------- NEW: shipping address state ----------
  const [shippingAddress, setShippingAddress] = useState(EMPTY_ADDRESS);
  const [addressError, setAddressError] = useState("");

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleAddressChange = (field) => (event) => {
    setShippingAddress((prev) => ({ ...prev, [field]: event.target.value }));
    if (addressError) setAddressError("");
  };

  const validateAddress = () => {
    const required = ["street", "city", "postalCode", "country", "phone"];
    const missing = required.filter((field) => !shippingAddress[field]?.trim());

    if (missing.length > 0) {
      setAddressError("Please fill in all shipping fields.");
      return false;
    }

    // Phone sanity check (Egyptian: 10–15 digits, optional +)
    if (!/^\+?\d{10,15}$/.test(shippingAddress.phone.trim())) {
      setAddressError("Please enter a valid phone number.");
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (checkoutLoading || !cart?._id || cartItems.length === 0) return;
    if (!validateAddress()) return;

    setCheckoutLoading(true);

    try {
      // Trim each field before sending
      const payload = Object.fromEntries(
        Object.entries(shippingAddress).map(([k, v]) => [k, v.trim()]),
      );

      const response = await checkoutSession(cart._id, payload);
      const checkoutUrl = response.data?.session?.url;

      if (!checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      showToast(
        "error",
        apiMessage(err, "Couldn't start checkout. Please try again."),
      );
      setCheckoutLoading(false);
    }
  };

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const loadCart = async () => {
    setLoading(true);
    setError(null);

    try {
      await refreshCart();
    } catch {
      setError("We couldn't load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (type, message) => {
    setToast({ type, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  /* ---------- Totals ---------- */
  const subtotal =
    cart?.totalPrice ??
    cartItems.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0,
    );

  const discountValue = Number(cart?.discountValue) || 0;
  const couponApplied = Boolean(cart?.coupon) || discountValue > 0;
  const total = couponApplied
    ? (cart?.totalPriceAfterDiscount ?? subtotal - discountValue)
    : subtotal;

  const itemCount = cartItems.reduce(
    (n, item) => n + (Number(item.quantity) || 0),
    0,
  );

  /* ---------- Actions ---------- */
  const handleRemove = async (productId) => {
    if (removingId) return;
    setRemovingId(productId);

    try {
      await removeCartItem(productId);
      await refreshCart();
      showToast("success", "Item removed from cart");
    } catch (err) {
      showToast("error", apiMessage(err, "Couldn't remove item"));
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuantity = async (productId, nextQuantity) => {
    if (updatingId || nextQuantity < 1) return;
    setUpdatingId(productId);

    try {
      await updateCartItemQuantity(productId, nextQuantity);
      await refreshCart();
    } catch (err) {
      showToast("error", apiMessage(err, "Couldn't update quantity"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClear = async () => {
    if (clearing) return;
    setClearing(true);

    try {
      await clearCart();
      await refreshCart();
      setConfirmClear(false);
      showToast("success", "Cart cleared");
    } catch (err) {
      showToast("error", apiMessage(err, "Couldn't clear cart"));
    } finally {
      setClearing(false);
    }
  };

  const handleApplyCoupon = async (event) => {
    event.preventDefault();

    const name = couponName.trim();
    if (!name || couponBusy) return;

    setCouponBusy(true);
    setCouponError("");

    try {
      await applyCoupon({ couponName: name });
      await refreshCart();
      setCouponName("");
      showToast("success", "Coupon applied");
    } catch (err) {
      setCouponError(apiMessage(err, "Couldn't apply coupon"));
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (couponBusy) return;

    setCouponBusy(true);
    setCouponError("");

    try {
      await removeCoupon();
      await refreshCart();
      showToast("success", "Coupon removed");
    } catch (err) {
      showToast("error", apiMessage(err, "Couldn't remove coupon"));
    } finally {
      setCouponBusy(false);
    }
  };

  /* ---------- Signed out ---------- */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="cart-page">
        <div className="cart-state" role="status">
          <div className="cart-state__icon" aria-hidden="true">
            🛒
          </div>
          <h1>Sign in to view your cart</h1>
          <p>Log in to see the products you've added.</p>
          <Link
            to="/login"
            state={{ from: "/cart" }}
            className="cart-btn2 cart-btn2--primary">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <nav className="cart-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Cart</span>
        </nav>
        <div className="cart-header__row">
          <h1 className="cart-header__title">Shopping Cart</h1>
          {!loading && !error && cartItems.length > 0 && (
            <span className="cart-header__count">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </header>

      {loading ? (
        <div className="cart-layout" aria-busy="true">
          <div className="cart-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="cart-skeleton" aria-hidden="true">
                <div className="cart-skeleton__media cart-shimmer" />
                <div className="cart-skeleton__lines">
                  <div className="cart-skeleton__line cart-shimmer" />
                  <div className="cart-skeleton__line cart-skeleton__line--short cart-shimmer" />
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary cart-skeleton__summary cart-shimmer" />
        </div>
      ) : error ? (
        <div className="cart-state cart-state--error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="cart-btn2 cart-btn2--primary"
            onClick={loadCart}>
            Retry
          </button>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="cart-state" role="status">
          <div className="cart-state__icon" aria-hidden="true">
            🛒
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="cart-btn2 cart-btn2--primary">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* ---------- Items ---------- */}
          <section className="cart-list" aria-label="Cart items">
            {cartItems.map((item) => {
              const product =
                item.product && typeof item.product === "object"
                  ? item.product
                  : null;
              const productId = product?._id ?? item.product;
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.price) || 0;
              const title = product?.title || "Product";

              const busy = removingId === productId;
              const updating = updatingId === productId;

              const stock = product?.quantity;
              const maxQty = stock === undefined ? null : Number(stock);

              return (
                <article key={item._id} className="cart-item">
                  <Link
                    to={`/products/${productId}`}
                    className="cart-item__media"
                    aria-label={`View ${title}`}>
                    {product?.imageCover ? (
                      <img
                        src={product.imageCover}
                        alt={title}
                        loading="lazy"
                      />
                    ) : (
                      <span className="cart-item__placeholder">No image</span>
                    )}
                  </Link>

                  <div className="cart-item__info">
                    <Link
                      to={`/products/${productId}`}
                      className="cart-item__title">
                      {title}
                    </Link>
                    {item.color && (
                      <span className="cart-item__meta">
                        Color: {item.color}
                      </span>
                    )}
                    <span className="cart-item__meta">
                      {money(unitPrice)} each
                    </span>
                    <div
                      className="cart-qty"
                      role="group"
                      aria-label={`Quantity for ${title}`}>
                      <button
                        type="button"
                        onClick={() => handleQuantity(productId, quantity - 1)}
                        disabled={updating || busy || quantity <= 1}
                        aria-label="Decrease quantity">
                        −
                      </button>
                      <span className="cart-qty__value" aria-live="polite">
                        {updating ? "…" : quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantity(productId, quantity + 1)}
                        disabled={
                          updating ||
                          busy ||
                          (maxQty !== null && quantity >= maxQty)
                        }
                        aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item__side">
                    <span className="cart-item__total">
                      {money(unitPrice * quantity)}
                    </span>
                    <button
                      type="button"
                      className="cart-item__remove"
                      onClick={() => handleRemove(productId)}
                      disabled={busy}
                      aria-label={`Remove ${title} from cart`}>
                      {busy ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}

            <div className="cart-list__footer">
              <Link to="/products" className="cart-link">
                ← Continue shopping
              </Link>

              {confirmClear ? (
                <span className="cart-confirm">
                  Clear the whole cart?
                  <button
                    type="button"
                    className="cart-btn2 cart-btn2--danger cart-btn2--sm"
                    onClick={handleClear}
                    disabled={clearing}>
                    {clearing ? "Clearing…" : "Yes, clear"}
                  </button>
                  <button
                    type="button"
                    className="cart-btn2 cart-btn2--sm"
                    onClick={() => setConfirmClear(false)}
                    disabled={clearing}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="cart-link cart-link--danger"
                  onClick={() => setConfirmClear(true)}>
                  Clear cart
                </button>
              )}
            </div>
          </section>

          {/* ---------- Summary ---------- */}
          <aside className="cart-summary" aria-label="Order summary">
            <h2>Order summary</h2>

            {/* ---------- NEW: Shipping address form ---------- */}
            <div className="cart-address">
              <h3 className="cart-address__title">Shipping address</h3>

              <label htmlFor="addr-street">Street</label>
              <input
                id="addr-street"
                type="text"
                value={shippingAddress.street}
                onChange={handleAddressChange("street")}
                placeholder="123 Main St, Apt 4"
                autoComplete="street-address"
                required
              />

              <div className="cart-address__row">
                <div>
                  <label htmlFor="addr-city">City</label>
                  <input
                    id="addr-city"
                    type="text"
                    value={shippingAddress.city}
                    onChange={handleAddressChange("city")}
                    placeholder="Cairo"
                    autoComplete="address-level2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="addr-postal">Postal code</label>
                  <input
                    id="addr-postal"
                    type="text"
                    value={shippingAddress.postalCode}
                    onChange={handleAddressChange("postalCode")}
                    placeholder="11511"
                    autoComplete="postal-code"
                    required
                  />
                </div>
              </div>

              <div className="cart-address__row">
                <div>
                  <label htmlFor="addr-country">Country</label>
                  <select
                    id="addr-country"
                    value={shippingAddress.country}
                    onChange={handleAddressChange("country")}
                    autoComplete="country">
                    <option value="EG">Egypt</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">United Arab Emirates</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="addr-phone">Phone</label>
                  <input
                    id="addr-phone"
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={handleAddressChange("phone")}
                    placeholder="+20 100 123 4567"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {addressError && (
                <p className="cart-coupon__error" role="alert">
                  {addressError}
                </p>
              )}
            </div>

            {/* ---------- Coupon ---------- */}
            <div className="cart-coupon">
              <label htmlFor="cart-coupon-input">Coupon code</label>

              {couponApplied ? (
                <div className="cart-coupon__applied">
                  <span>
                    <span aria-hidden="true">✓</span> Coupon applied
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={couponBusy}>
                    {couponBusy ? "…" : "Remove"}
                  </button>
                </div>
              ) : (
                <form
                  className="cart-coupon__form"
                  onSubmit={handleApplyCoupon}>
                  <input
                    id="cart-coupon-input"
                    type="text"
                    value={couponName}
                    onChange={(e) => {
                      setCouponName(e.target.value);
                      if (couponError) setCouponError("");
                    }}
                    placeholder="Enter code"
                    autoComplete="off"
                    aria-invalid={couponError ? "true" : undefined}
                    aria-describedby={
                      couponError ? "cart-coupon-error" : undefined
                    }
                  />
                  <button
                    type="submit"
                    className="cart-btn2 cart-btn2--secondary"
                    disabled={!couponName.trim() || couponBusy}>
                    {couponBusy ? "Applying…" : "Apply"}
                  </button>
                </form>
              )}

              {couponError && (
                <p id="cart-coupon-error" className="cart-coupon__error">
                  {couponError}
                </p>
              )}
            </div>

            {/* ---------- Totals ---------- */}
            <dl className="cart-summary__rows">
              <div>
                <dt>Subtotal</dt>
                <dd>{money(subtotal)}</dd>
              </div>

              {couponApplied && discountValue > 0 && (
                <div className="cart-summary__discount">
                  <dt>Discount</dt>
                  <dd>-{money(discountValue)}</dd>
                </div>
              )}

              <div className="cart-summary__total">
                <dt>Total</dt>
                <dd>{money(total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading || !cart?._id || cartItems.length === 0}
              className="cart-btn2 cart-btn2--primary cart-btn2--block">
              {checkoutLoading
                ? "Redirecting to Stripe..."
                : "Proceed to checkout"}
            </button>
          </aside>
        </div>
      )}

      {toast && (
        <div
          key={toast.message}
          className={`cart-toast cart-toast--${toast.type}`}
          role="status"
          aria-live="polite">
          <span aria-hidden="true">{toast.type === "success" ? "✓" : "!"}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
