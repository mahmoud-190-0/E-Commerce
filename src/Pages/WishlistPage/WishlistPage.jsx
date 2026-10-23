import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import RatingStars from "../../components/products/RatingStars";
import { addToCart } from "../../services/cartService";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

import "./WishlistPage.css";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { cartItems, refreshCart } = useCart();
  const {
    wishlistIds,
    wishlistLoading,

    removeItem,
    refreshWishlist,
  } = useWishlist();

  const [error, setError] = useState(null);
  const [busyKey, setBusyKey] = useState(null); // `${id}:${action}`
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // When the user logs out, clear any local error state.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setError(null);
    }
  }, [authLoading, isAuthenticated]);

  // Cleanup toast timer on unmount.
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (type, message) => {
    setToast({ type, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const isInCart = (id) =>
    cartItems.some((item) => {
      const productId =
        typeof item.product === "object" ? item.product?._id : item.product;
      return String(productId) === String(id);
    });

  const handleRetry = async () => {
    setError(null);
    try {
      await refreshWishlist();
    } catch {
      setError("We couldn't load your wishlist. Please try again.");
    }
  };

  const handleRemove = async (id) => {
    const key = `${id}:remove`;
    if (busyKey) return;
    setBusyKey(key);

    try {
      await removeItem(id);
      showToast("success", "Removed from wishlist");
    } catch {
      showToast("error", "Couldn't remove product");
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddToCart = async (id) => {
    const key = `${id}:cart`;
    if (busyKey || isInCart(id)) return;
    setBusyKey(key);

    try {
      await addToCart({ productId: id, quantity: 1 });
      if (refreshCart) await refreshCart();
      showToast("success", "Product added to cart");
    } catch {
      showToast("error", "Couldn't add product to cart");
    } finally {
      setBusyKey(null);
    }
  };

  /* ---------- Not signed in ---------- */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-state" role="status">
          <div className="wishlist-state__icon" aria-hidden="true">
            ♡
          </div>
          <h1>Sign in to see your wishlist</h1>
          <p>Log in to save products and find them here later.</p>
          <Link
            to="/login"
            state={{ from: "/wishlist" }}
            className="wishlist-btn2 wishlist-btn2--primary">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const loading = authLoading || wishlistLoading;
  const visibleIds = wishlistIds; // context already keeps this normalized

  return (
    <div className="wishlist-page">
      <header className="wishlist-header">
        <nav className="wishlist-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Wishlist</span>
        </nav>
        <h1 className="wishlist-header__title">My Wishlist</h1>
        {!loading && !error && visibleIds.length > 0 && (
          <p className="wishlist-header__count">
            {visibleIds.length} saved product
            {visibleIds.length === 1 ? "" : "s"}
          </p>
        )}
      </header>

      {loading ? (
        <div className="wishlist-grid" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="wishlist-skeleton" aria-hidden="true">
              <div className="wishlist-skeleton__media wishlist-shimmer" />
              <div className="wishlist-skeleton__line wishlist-shimmer" />
              <div className="wishlist-skeleton__line wishlist-skeleton__line--short wishlist-shimmer" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="wishlist-state wishlist-state--error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="wishlist-btn2 wishlist-btn2--primary"
            onClick={handleRetry}>
            Retry
          </button>
        </div>
      ) : visibleIds.length === 0 ? (
        <div className="wishlist-state" role="status">
          <div className="wishlist-state__icon" aria-hidden="true">
            ♡
          </div>
          <h2>Your wishlist is empty</h2>
          <p>Tap the heart on any product to save it here.</p>
          <Link to="/products" className="wishlist-btn2 wishlist-btn2--primary">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {visibleIds.map((id) => {
            const inCart = isInCart(id);
            const removing = busyKey === `${id}:remove`;
            const adding = busyKey === `${id}:cart`;
            const busy = removing || adding;

            return (
              <WishlistItem
                key={id}
                id={id}
                inCart={inCart}
                removing={removing}
                adding={adding}
                busy={busy}
                onRemove={() => handleRemove(id)}
                onAddToCart={() => handleAddToCart(id)}
              />
            );
          })}
        </div>
      )}

      {toast && (
        <div
          key={toast.message}
          className={`wishlist-toast wishlist-toast--${toast.type}`}
          role="status"
          aria-live="polite">
          <span aria-hidden="true">{toast.type === "success" ? "✓" : "!"}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Item component — fetches its own product data.
   Why? Because WishlistContext stores ids only, not full products.
   If your /wishlist endpoint returns populated products instead,
   replace this with the inline card that uses `product`.
------------------------------------------------------------------ */
function WishlistItem({
  id,
  inCart,
  removing,
  adding,
  busy,
  onRemove,
  onAddToCart,
}) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    // TODO: replace with your real "get single product" service call.
    // import { getProduct } from "../../services/productService";
    // getProduct(id).then(...)
    import("../../services/productService")
      .then(({ getProduct }) => getProduct(id))
      .then((response) => {
        if (cancelled) return;
        setProduct(response?.data?.data ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="wishlist-skeleton" aria-hidden="true">
        <div className="wishlist-skeleton__media wishlist-shimmer" />
        <div className="wishlist-skeleton__line wishlist-shimmer" />
        <div className="wishlist-skeleton__line wishlist-skeleton__line--short wishlist-shimmer" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <article className="wishlist-card">
        <div className="wishlist-card__body">
          <p className="wishlist-card__title">Product unavailable</p>
          <button
            type="button"
            className="wishlist-btn wishlist-btn--primary wishlist-card__cart"
            onClick={onRemove}
            disabled={busy}>
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      </article>
    );
  }

  const pid = product._id || product.id;
  const inStock =
    product.quantity === undefined || Number(product.quantity) > 0;

  const basePrice = Number(product.price) || 0;
  const discounted = Number(product.priceAfterDiscount);
  const hasDiscount =
    Number.isFinite(discounted) && discounted > 0 && discounted < basePrice;
  const finalPrice = hasDiscount ? discounted : basePrice;

  return (
    <article className="wishlist-card">
      <div className="wishlist-card__media">
        <Link
          to={`/products/${pid}`}
          className="wishlist-card__image-link"
          aria-label={`View ${product.title}`}>
          {product.imageCover ? (
            <img
              className="wishlist-card__image"
              src={product.imageCover}
              alt={product.title || "Product"}
              loading="lazy"
            />
          ) : (
            <div className="wishlist-card__placeholder" aria-hidden="true">
              <span>Image unavailable</span>
            </div>
          )}
        </Link>

        {!inStock && (
          <span className="wishlist-card__stock-badge">Out of stock</span>
        )}

        <button
          type="button"
          className="wishlist-card__remove"
          onClick={onRemove}
          disabled={busy}
          aria-label={`Remove ${product.title} from wishlist`}
          title="Remove from wishlist">
          {removing ? (
            "…"
          ) : (
            <Heart size={18} fill="currentColor" strokeWidth={2} />
          )}
        </button>
      </div>

      <div className="wishlist-card__body">
        <Link to={`/products/${pid}`} className="wishlist-card__title">
          {product.title}
        </Link>

        <div className="wishlist-card__rating">
          <RatingStars
            value={Number(product.ratingsAverage) || 0}
            count={Number(product.ratingsQuantity) || 0}
          />
        </div>

        <div className="wishlist-card__pricing">
          <span className="wishlist-card__price">${finalPrice.toFixed(2)}</span>
          {hasDiscount && (
            <span className="wishlist-card__old-price">
              ${basePrice.toFixed(2)}
            </span>
          )}
        </div>

        <button
          type="button"
          className={`wishlist-btn2 wishlist-btn2--primary wishlist-card__cart ${
            inCart ? "is-in-cart" : ""
          }`}
          onClick={onAddToCart}
          disabled={!inStock || inCart || busy}>
          {!inStock
            ? "Unavailable"
            : inCart
              ? "✓ In cart"
              : adding
                ? "Adding..."
                : "+ Add to cart"}
        </button>
      </div>
    </article>
  );
}
