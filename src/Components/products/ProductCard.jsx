import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Heart, LoaderCircle } from "lucide-react";

import RatingStars from "./RatingStars";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { cartItems, addItemToCart, isCartPending } = useCart();
  const { isInWishlist, addItem, removeItem } = useWishlist();

  const location = useLocation();

  const [cartBusy, setCartBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [toast, setToast] = useState(null);
  const id = product._id || product.id;

  // ✅ Both flags come from context — always in sync with the global state.
  const wishlisted = isInWishlist(id);

  const isInCart = cartItems.some((item) => {
    const productId =
      typeof item.product === "object" ? item.product?._id : item.product;

    return String(productId) === String(id);
  });

  const basePrice = Number(product.price) || 0;
  const discountedPrice = Number(product.priceAfterDiscount);

  const hasDiscount =
    Number.isFinite(discountedPrice) &&
    discountedPrice > 0 &&
    discountedPrice < basePrice;

  const finalPrice = hasDiscount ? discountedPrice : basePrice;

  const discountPercentage = hasDiscount
    ? Math.round(((basePrice - discountedPrice) / basePrice) * 100)
    : 0;

  const inStock = Number(product.quantity) > 0;

  const showToast = (type, message) => {
    setToast({ type, message });

    // Replace any existing timer to avoid overlapping toast messages.
    if (showToast.timer) clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      setToast(null);
      showToast.timer = null;
    }, 2500);
  };
  const cartPending = isCartPending?.(id) ?? false;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setLoginPrompt(true);
      return;
    }

    if (!inStock || cartBusy || isInCart) return;

    setCartBusy(true);

    try {
      // الـ Context يحدّث السلة والعداد فورًا
      await addItemToCart(product, 1);

      showToast("success", "Product added to cart");
    } catch (error) {
      showToast("error", "Couldn't add product to cart");
    } finally {
      setCartBusy(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      setLoginPrompt(true);
      return;
    }

    if (wishBusy) return;

    setWishBusy(true);

    try {
      if (wishlisted) {
        await removeItem(id);
        showToast("success", "Removed from wishlist");
      } else {
        await addItem(id);
        showToast("success", "Added to wishlist");
      }
    } catch {
      showToast("error", "Couldn't update wishlist");
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <>
      <article className="product-card">
        {/* Product image */}
        <div className="product-card__media">
          <Link
            to={`/products/${id}`}
            className="product-card__image-link"
            aria-label={`View ${product.title}`}>
            {product.imageCover ? (
              <img
                className="product-card__image"
                src={product.imageCover}
                alt={product.title || "Product"}
                loading="lazy"
              />
            ) : (
              <div className="product-card__placeholder" aria-hidden="true">
                <span>Image unavailable</span>
              </div>
            )}
          </Link>
          {hasDiscount && (
            <span className="product-card__badge">-{discountPercentage}%</span>
          )}
          {!inStock && (
            <span className="product-card__stock-badge">Out of stock</span>
          )}
          <button
            type="button"
            className={`product-card__wishlist ${
              wishlisted ? "is-active" : ""
            }`}
            onClick={handleWishlist}
            disabled={wishBusy}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
            {wishBusy ? (
              <LoaderCircle className="animate-spin" size={20} />
            ) : (
              <Heart
                size={20}
                strokeWidth={2}
                fill={wishlisted ? "currentColor" : "none"}
              />
            )}
          </button>
          ```
          <Link to={`/products/${id}`} className="product-card__quick-view">
            View details <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {/* Product information */}
        <div className="product-card__body">
          {product.category?.name && (
            <span className="product-card__category">
              {product.category.name}
            </span>
          )}

          <Link to={`/products/${id}`} className="product-card__title">
            {product.title}
          </Link>

          <div className="product-card__rating">
            <RatingStars
              value={Number(product.ratingsAverage) || 0}
              count={Number(product.ratingsQuantity) || 0}
            />
          </div>

          <div className="product-card__pricing">
            <span className="product-card__price">
              ${finalPrice.toFixed(2)}
            </span>

            {hasDiscount && (
              <span className="product-card__old-price">
                ${basePrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="product-card__footer">
            <span
              className={`product-card__availability ${
                inStock ? "is-available" : "is-unavailable"
              }`}>
              <span className="product-card__availability-dot" />
              {inStock ? "In stock" : "Unavailable"}
            </span>

            <button
              type="button"
              className={`product-card__cart-btn ${
                isInCart ? "is-in-cart" : ""
              }`}
              onClick={handleAddToCart}
              disabled={
                !inStock || cartBusy || cartPending || cartPending || isInCart
              }>
              {cartBusy ? (
                "Adding..."
              ) : !inStock ? (
                "Unavailable"
              ) : isInCart ? (
                <>
                  <span aria-hidden="true">✓</span>
                  In cart
                </>
              ) : (
                <>
                  <span aria-hidden="true">+</span>
                  Add to cart
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast notification */}
        {toast && (
          <div
            key={toast.message}
            className={`product-card__toast product-card__toast--${toast.type}`}
            role="status"
            aria-live="polite">
            <span aria-hidden="true">
              {toast.type === "success" ? "✓" : "!"}
            </span>
            {toast.message}
          </div>
        )}
      </article>

      {/* Login prompt */}
      {loginPrompt && (
        <div
          className="product-card__modal-overlay"
          onClick={() => setLoginPrompt(false)}>
          <div
            className="product-card__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-login-title"
            onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="product-card__modal-close"
              onClick={() => setLoginPrompt(false)}
              aria-label="Close dialog">
              ×
            </button>

            <div className="product-card__modal-icon">♡</div>

            <h3 id="product-login-title">Sign in to continue</h3>

            <p>Log in to add products to your cart or wishlist.</p>

            <div className="product-card__modal-actions">
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="product-card__login-btn">
                Log in
              </Link>

              <button
                type="button"
                className="product-card__cancel-btn"
                onClick={() => setLoginPrompt(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
