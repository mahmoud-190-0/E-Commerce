import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageOff,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  createProductReview,
  getProduct,
  getProductReviews,
  getProducts,
} from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import RatingStars from "../../components/products/RatingStars";
import ProductCard from "../../components/products/ProductCard";
import "./ProductDetails.css";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatPrice = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? currency.format(n) : null;
};

const formatDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

/**
 * The product endpoint responds with `{ data: product }` and axios wraps that
 * in its own `.data`, so the product lives at `res.data.data`.
 * Falls back defensively for other shapes (e.g. `{ data: { product } }`).
 */
const extractProduct = (res) => {
  const body = res?.data;
  const inner = body?.data ?? body;
  return inner?.product ?? inner ?? null;
};

/** Reviews / products endpoints shape is not guaranteed — accept common variants. */
const extractList = (res) => {
  const body = res?.data;
  const candidate = body?.data ?? body?.reviews ?? body;
  if (Array.isArray(candidate)) return candidate;
  if (Array.isArray(candidate?.reviews)) return candidate.reviews;
  return [];
};

const getId = (value) =>
  value && typeof value === "object" ? value._id || value.id : value;

const getName = (value) =>
  value && typeof value === "object" ? value.name || value.title || null : null;

const looksLikeId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong. Please try again.";

const normalizeReview = (r, index) => ({
  id: r?._id || r?.id || `review-${index}`,
  userId: getId(r?.user) ?? null,
  name:
    r?.user?.name ||
    r?.user?.username ||
    r?.user?.firstName ||
    r?.name ||
    "Anonymous",
  rating: Number(r?.rating ?? r?.ratings ?? 0) || 0,
  text: r?.comment || r?.review || r?.text || r?.title || "",
  date: formatDate(r?.createdAt),
});

/* ------------------------------------------------------------------ */
/* Cart helpers                                                       */
/* ------------------------------------------------------------------ */

const getProductId = (item) =>
  String(getId(item?.product) ?? getId(item?.productId) ?? "");

/** Finds the cart line that belongs to a product (handles populated or plain-id `product`). */
const findCartItem = (cartItems, productId) => {
  if (!productId || !Array.isArray(cartItems)) return undefined;
  return cartItems.find((item) => getProductId(item) === String(productId));
};

/**
 * Add/remove toggle used by the main "Add to cart" button.
 * All optimistic logic stays inside CartContext.
 * Cart API operations are keyed by product ID, not cart-line `_id`.
 */
function useCartToggle(product) {
  const { cartItems, addItemToCart, removeItem: removeCartItem } = useCart();
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const productId = product?._id;

  const cartItem = useMemo(
    () => findCartItem(cartItems, productId),
    [cartItems, productId],
  );

  const toggle = useCallback(
    async (qty = 1) => {
      if (!productId || busy.current) return null;
      busy.current = true;
      setPending(true);
      try {
        if (cartItem) {
          await removeCartItem(productId);
          return "removed";
        }
        await addItemToCart(product, qty);
        return "added";
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
    [productId, product, cartItem, addItemToCart, removeCartItem],
  );

  return { inCart: Boolean(cartItem), pending, toggle };
}

/* ------------------------------------------------------------------ */
/* Small components                                                   */
/* ------------------------------------------------------------------ */

function Skeleton() {
  return (
    <div
      className="pd pd__container"
      aria-busy="true"
      aria-label="Loading product">
      <div className="pd-skel pd-skel--crumb" />
      <div className="pd__grid">
        <div>
          <div className="pd-skel pd-skel--image" />
          <div className="pd-skel__row">
            <div className="pd-skel pd-skel--thumb" />
            <div className="pd-skel pd-skel--thumb" />
            <div className="pd-skel pd-skel--thumb" />
          </div>
        </div>
        <div className="pd-skel__col">
          <div className="pd-skel pd-skel--title" />
          <div className="pd-skel pd-skel--line" />
          <div className="pd-skel pd-skel--price" />
          <div className="pd-skel pd-skel--line" />
          <div className="pd-skel pd-skel--line pd-skel--short" />
          <div className="pd-skel pd-skel--button" />
        </div>
      </div>
    </div>
  );
}

function StateMessage({ title, message, onRetry, children }) {
  return (
    <div className="pd pd__container">
      <div className="pd-state" role="alert">
        <AlertCircle size={44} aria-hidden="true" />
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="pd-state__actions">
          {onRetry && (
            <button
              type="button"
              className="pd-btn pd-btn--primary"
              onClick={onRetry}>
              <RefreshCw size={18} aria-hidden="true" /> Try again
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function Gallery({ title, images }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(() => new Set());
  const [loaded, setLoaded] = useState(() => new Set());
  const [zoom, setZoom] = useState(false);

  const markFailed = (src) => setFailed((prev) => new Set(prev).add(src));
  const markLoaded = (src) => setLoaded((prev) => new Set(prev).add(src));

  const current = images[active];
  const hasImage = current && !failed.has(current);
  const total = images.length;

  const go = useCallback(
    (delta) => setActive((i) => (total ? (i + delta + total) % total : 0)),
    [total],
  );

  // Works while focus is on the main image, a thumbnail, or inside the fullscreen preview.
  const onKeyDown = (e) => {
    if (total < 2) return;
    const keys = {
      ArrowRight: () => go(1),
      ArrowLeft: () => go(-1),
      Home: () => setActive(0),
      End: () => setActive(total - 1),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  };

  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (e) => e.key === "Escape" && setZoom(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoom]);

  return (
    <div className="pd-gallery" onKeyDown={onKeyDown}>
      <div
        className="pd-gallery__main"
        role="group"
        aria-label={
          total > 1
            ? "Product image viewer. Use the left and right arrow keys to switch images."
            : "Product image"
        }
        tabIndex={total > 1 ? 0 : undefined}>
        {hasImage ? (
          <>
            {!loaded.has(current) && (
              <div className="pd-skel pd-gallery__loading" />
            )}
            <img
              key={current}
              src={current}
              alt={`${title} — image ${active + 1} of ${images.length}`}
              className={`pd-gallery__img ${loaded.has(current) ? "is-loaded" : ""}`}
              onLoad={() => markLoaded(current)}
              onError={() => markFailed(current)}
            />
            <button
              type="button"
              className="pd-gallery__zoom"
              onClick={() => setZoom(true)}
              aria-label="View image fullscreen">
              <Maximize2 size={18} aria-hidden="true" />
            </button>
            {total > 1 && (
              <>
                <button
                  type="button"
                  className="pd-gallery__nav pd-gallery__nav--prev"
                  onClick={() => go(-1)}
                  aria-label="Previous image">
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pd-gallery__nav pd-gallery__nav--next"
                  onClick={() => go(1)}
                  aria-label="Next image">
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="pd-gallery__placeholder">
            <ImageOff size={48} aria-hidden="true" />
            <span>No image available</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="pd-gallery__thumbs" aria-label="Product images">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={`pd-thumb ${i === active ? "is-active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}>
                {failed.has(src) ? (
                  <ImageOff size={20} aria-hidden="true" />
                ) : (
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    onError={() => markFailed(src)}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoom && hasImage && (
        <div
          className="pd-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} fullscreen preview`}
          onClick={() => setZoom(false)}>
          <button
            type="button"
            className="pd-lightbox__close"
            onClick={() => setZoom(false)}
            aria-label="Close preview"
            autoFocus>
            <X size={22} aria-hidden="true" />
          </button>
          <img src={current} alt={title} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function Reviews({ state }) {
  const { loading, error, items } = state;

  if (loading) {
    return (
      <div className="pd-reviews__status" aria-live="polite">
        <Loader2 size={20} className="pd-spin" aria-hidden="true" /> Loading
        reviews…
      </div>
    );
  }
  if (error) {
    return (
      <p className="pd-reviews__status pd-reviews__status--error" role="alert">
        <AlertCircle size={18} aria-hidden="true" /> {error}
      </p>
    );
  }
  if (!items.length) {
    return (
      <p className="pd-reviews__status">No reviews yet for this product.</p>
    );
  }

  return (
    <ul className="pd-reviews">
      {items.map((r) => (
        <li key={r.id} className="pd-review">
          <div className="pd-review__avatar" aria-hidden="true">
            {r.name.charAt(0).toUpperCase()}
          </div>
          <div className="pd-review__body">
            <div className="pd-review__head">
              <strong>{r.name}</strong>
              {r.date && <time className="pd-review__date">{r.date}</time>}
            </div>
            {r.rating > 0 && <RatingStars value={r.rating} count={0} />}
            {r.text && <p>{r.text}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReviewForm({ productId, hasReviewed, onCreated }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null); // { type, message, login? }

  const shown = hover || rating;

  const onStarsKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setRating((r) => Math.min(5, r + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setRating((r) => Math.max(1, r - 1));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting || authLoading) return;

    if (!isAuthenticated) {
      setAlert({
        type: "error",
        message: "Please log in to add a review.",
        login: true,
      });
      return;
    }
    if (user?.role !== "user") {
      setAlert({
        type: "warning",
        message:
          user?.role === "admin"
            ? "You're signed in as an admin. Admin accounts can't add reviews — please use a customer account."
            : "Only customer accounts can add reviews.",
      });
      return;
    }
    if (!rating) {
      setAlert({
        type: "error",
        message: "Please choose a star rating first.",
      });
      return;
    }
    const text = comment.trim();
    if (text && (text.length < 3 || text.length > 100)) {
      setAlert({
        type: "error",
        message: "Your comment must be between 3 and 100 characters.",
      });
      return;
    }

    setSubmitting(true);
    setAlert(null);
    try {
      // The backend review model takes `ratings` and an optional `title`; the comment is sent as `title`.
      await createProductReview(productId, {
        ratings: rating,
        ...(text ? { title: text } : {}),
      });
      setRating(0);
      setComment("");
      setAlert({
        type: "success",
        message: "Thanks! Your review has been saved.",
      });
      await onCreated?.();
    } catch (err) {
      setAlert({ type: "error", message: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pd-rform">
      <h3>Write a review</h3>

      {alert && (
        <p className={`pd-alert pd-alert--${alert.type}`} role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>
            {alert.message}{" "}
            {alert.login && (
              <Link to="/login" className="pd-alert__link">
                Log in
              </Link>
            )}
          </span>
        </p>
      )}

      {hasReviewed ? (
        <p className="pd-rform__done">You've already reviewed this product.</p>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="pd-rform__field">
            <span id="pd-rate-label">Your rating</span>
            <div
              className="pd-stars-input"
              role="radiogroup"
              aria-labelledby="pd-rate-label"
              onKeyDown={onStarsKeyDown}
              onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  tabIndex={rating === n || (!rating && n === 1) ? 0 : -1}
                  className={n <= shown ? "is-on" : ""}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}>
                  <Star
                    size={26}
                    fill={n <= shown ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="pd-rform__field">
            <label htmlFor="pd-comment">Your comment (optional)</label>
            <textarea
              id="pd-comment"
              rows={3}
              maxLength={100}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what you liked or didn't like…"
            />
            <span className="pd-rform__count">{comment.length}/100</span>
          </div>

          <button
            type="submit"
            className="pd-btn pd-btn--primary"
            disabled={submitting}
            aria-busy={submitting}>
            {submitting && (
              <Loader2 size={18} className="pd-spin" aria-hidden="true" />
            )}
            {submitting ? "Saving…" : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
}

function RelatedProducts({ products }) {
  if (!products.length) return null;

  return (
    <section className="pd-related" aria-labelledby="pd-related-title">
      <h2 id="pd-related-title">You may also like</h2>
      <div className="products-grid pd-related__grid">
        {products.map((p) => (
          <ProductCard key={p._id || p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "description", label: "Description" },
  { key: "reviews", label: "Reviews" },
  { key: "info", label: "Product Information" },
];

export default function ProductDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { isInWishlist, addItem, removeItem, isWishlistPending } =
    useWishlist();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error | notfound
  const [errorMsg, setErrorMsg] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [reviewsState, setReviewsState] = useState({
    loading: false,
    error: "",
    items: [],
  });
  const [related, setRelated] = useState([]);

  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(null);
  const [tab, setTab] = useState("description");

  const [reviewsKey, setReviewsKey] = useState(0);
  const {
    inCart,
    pending: cartPending,
    toggle: toggleCart,
  } = useCartToggle(product);

  const [wishPending, setWishPending] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, message }
  const busyRef = useRef({ cart: false, wish: false });
  const feedbackTimer = useRef(null);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const notify = useCallback((type, message) => {
    setFeedback({ type, message });
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4500);
  }, []);

  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  /* ---- Product fetch (stale-request safe) ---- */
  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    setErrorMsg("");
    setQuantity(1);
    setTab("description");
    setFeedback(null);
    setRelated([]);

    if (!id || !looksLikeId(id)) {
      setProduct(null);
      setStatus("notfound");
      return undefined;
    }

    getProduct(id)
      .then((res) => {
        if (cancelled) return;
        const data = extractProduct(res);
        if (!data || !data._id) {
          setProduct(null);
          setStatus("notfound");
          return;
        }
        setProduct(data);
        setColor(
          Array.isArray(data.colors) && data.colors.length
            ? data.colors[0]
            : null,
        );
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setProduct(null);
        if (err?.response?.status === 404) {
          setStatus("notfound");
        } else {
          setErrorMsg(getErrorMessage(err));
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  /* ---- Reviews fetch (independent of product loading) ---- */
  const productId = product?._id;
  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    setReviewsState({ loading: true, error: "", items: [] });

    getProductReviews(productId)
      .then((res) => {
        if (cancelled) return;
        setReviewsState({
          loading: false,
          error: "",
          items: extractList(res).map(normalizeReview),
        });
      })
      .catch((err) => {
        if (cancelled) return;
        // 404 on a reviews route usually just means "no reviews".
        if (err?.response?.status === 404) {
          setReviewsState({ loading: false, error: "", items: [] });
        } else {
          setReviewsState({
            loading: false,
            error: getErrorMessage(err),
            items: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId, reloadKey, reviewsKey]);

  /* ---- Related products (small, same category, silent on failure) ---- */
  const categoryId = getId(product?.category);
  useEffect(() => {
    if (!productId || !categoryId) return undefined;
    let cancelled = false;

    getProducts({ category: categoryId, limit: 5 })
      .then((res) => {
        if (cancelled) return;
        const list = extractList(res)
          .filter((p) => p && p._id && p._id !== productId)
          .slice(0, 4);
        setRelated(list);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [productId, categoryId]);

  /* ---- Derived data ---- */
  const view = useMemo(() => {
    if (!product) return null;

    const price = Number(product.price);
    const discounted = Number(product.priceAfterDiscount);
    const hasPrice = Number.isFinite(price) && price >= 0;
    const hasDiscount =
      hasPrice &&
      Number.isFinite(discounted) &&
      discounted > 0 &&
      discounted < price;
    const discountPercent = hasDiscount
      ? Math.round(((price - discounted) / price) * 100)
      : 0;

    const stock = Math.max(0, Math.floor(Number(product.quantity) || 0));

    const images = [
      product.imageCover,
      ...(Array.isArray(product.images) ? product.images : []),
    ]
      .filter((src) => typeof src === "string" && src.trim())
      .filter((src, i, arr) => arr.indexOf(src) === i);

    const colors = (Array.isArray(product.colors) ? product.colors : []).filter(
      (c) => typeof c === "string" && c.trim(),
    );

    return {
      hasPrice,
      hasDiscount,
      discountPercent,
      finalPrice: hasDiscount ? discounted : price,
      originalPrice: price,
      stock,
      images,
      colors,
      categoryName: getName(product.category),
      brandName:
        getName(product.brand) ||
        (typeof product.brand === "string" && !looksLikeId(product.brand)
          ? product.brand
          : null),
      ratingsAverage: Number(product.ratingsAverage) || 0,
      ratingsQuantity: Number(product.ratingsQuantity) || 0,
      sold: Number(product.sold) || 0,
    };
  }, [product]);

  /* ---- Actions ---- */
  const handleAddToCart = async () => {
    if (!product || !view) return;
    if (!inCart && view.stock <= 0) return;

    const qty = Math.min(
      Math.max(1, Math.floor(quantity)),
      Math.max(view.stock, 1),
    );

    try {
      const result = await toggleCart(qty);
      if (result === "added")
        notify("success", `Added ${qty} × ${product.title} to your cart.`);
      if (result === "removed")
        notify("success", `${product.title} was removed from your cart.`);
    } catch (err) {
      notify("error", getErrorMessage(err));
    }
  };

  // After a review is saved: reload the list and quietly refresh the rating summary.
  const handleReviewCreated = async () => {
    setReviewsKey((k) => k + 1);
    try {
      const data = extractProduct(await getProduct(id));
      if (data?._id) setProduct(data);
    } catch {
      /* the review is saved; a stale average is harmless */
    }
  };

  const wished = product ? isInWishlist(product._id) : false;
  const wishBusy =
    wishPending ||
    (product ? Boolean(isWishlistPending?.(product._id)) : false);

  const handleWishlist = async () => {
    if (!product || busyRef.current.wish || wishBusy) return;
    busyRef.current.wish = true;
    setWishPending(true);
    try {
      if (wished) {
        await removeItem(product._id);
        notify("success", "Removed from your wishlist.");
      } else {
        await addItem(product._id);
        notify("success", "Saved to your wishlist.");
      }
    } catch (err) {
      notify("error", getErrorMessage(err));
    } finally {
      busyRef.current.wish = false;
      setWishPending(false);
    }
  };

  const onTabKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.key === tab);
    let next = null;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next].key);
    document.getElementById(`pd-tab-${TABS[next].key}`)?.focus();
  };

  /* ---- Render states ---- */
  if (status === "loading") return <Skeleton />;

  if (status === "error") {
    return (
      <StateMessage
        title="We couldn't load this product"
        message={errorMsg}
        onRetry={retry}>
        <Link to="/products" className="pd-btn pd-btn--ghost">
          Back to products
        </Link>
      </StateMessage>
    );
  }

  if (status === "notfound" || !product || !view) {
    return (
      <StateMessage
        title="Product not found"
        message="This product may have been removed or the link is incorrect.">
        <Link to="/products" className="pd-btn pd-btn--primary">
          Browse products
        </Link>
      </StateMessage>
    );
  }

  const outOfStock = view.stock <= 0;
  const atMax = quantity >= view.stock;
  const lowStock = !outOfStock && view.stock <= 5;
  const categoryLabel = view.categoryName || "Category";
  const infoRows = [
    ["Brand", view.brandName],
    ["Category", view.categoryName],
    ["Available colors", view.colors.length ? view.colors.join(", ") : null],
    ["In stock", outOfStock ? "Out of stock" : `${view.stock} units`],
    ["Units sold", view.sold ? view.sold.toLocaleString() : null],
    [
      "Rating",
      view.ratingsQuantity
        ? `${view.ratingsAverage.toFixed(1)} / 5 (${view.ratingsQuantity} ratings)`
        : null,
    ],
    ["Product ID", product._id],
    ["Listed on", formatDate(product.createdAt)],
  ].filter(([, v]) => v);

  return (
    <main className="pd">
      <div className="pd__container">
        {/* Breadcrumbs */}
        <nav className="pd-crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} />
            </li>
            <li>
              {categoryId ? (
                <Link to={`/products?category=${categoryId}`}>
                  {categoryLabel}
                </Link>
              ) : (
                <Link to="/products">Products</Link>
              )}
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} />
            </li>
            <li aria-current="page" className="pd-crumbs__current">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="pd__grid">
          {/* Gallery */}
          <Gallery
            key={product._id}
            title={product.title}
            images={view.images}
          />

          {/* Info */}
          <section className="pd-info" aria-labelledby="pd-title">
            <div className="pd-info__meta">
              {view.brandName && (
                <span className="pd-chip">{view.brandName}</span>
              )}
              {view.categoryName && (
                <span className="pd-chip pd-chip--soft">
                  {view.categoryName}
                </span>
              )}
            </div>

            <h1 id="pd-title" className="pd-info__title">
              {product.title}
            </h1>

            <div className="pd-info__rating">
              <RatingStars
                value={view.ratingsAverage}
                count={view.ratingsQuantity}
              />
              {view.sold > 0 && (
                <span className="pd-info__sold">
                  {view.sold.toLocaleString()} sold
                </span>
              )}
            </div>

            {view.hasPrice ? (
              <div className="pd-price">
                <span className="pd-price__final">
                  {formatPrice(view.finalPrice)}
                </span>
                {view.hasDiscount && (
                  <>
                    <s
                      className="pd-price__old"
                      aria-label={`Original price ${formatPrice(view.originalPrice)}`}>
                      {formatPrice(view.originalPrice)}
                    </s>
                    <span className="pd-price__badge">
                      −{view.discountPercent}%
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="pd-price pd-price--unavailable">
                Price unavailable
              </p>
            )}

            <p
              className={`pd-stock ${outOfStock ? "is-out" : lowStock ? "is-low" : "is-in"}`}
              role="status">
              <span className="pd-stock__dot" aria-hidden="true" />
              {outOfStock
                ? "Out of stock"
                : lowStock
                  ? `Only ${view.stock} left in stock`
                  : "In stock"}
            </p>

            {product.description && (
              <p className="pd-info__summary">{product.description}</p>
            )}

            {/* Colors */}
            {view.colors.length > 0 && (
              <fieldset className="pd-colors">
                <legend>
                  Color: <strong>{color}</strong>
                </legend>
                <div
                  className="pd-colors__list"
                  role="radiogroup"
                  aria-label="Choose a color">
                  {view.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={color === c}
                      aria-label={c}
                      title={c}
                      className={`pd-swatch ${color === c ? "is-active" : ""}`}
                      onClick={() => setColor(c)}>
                      <span
                        className="pd-swatch__color"
                        style={{
                          backgroundColor: c.toLowerCase().replace(/\s+/g, ""),
                        }}>
                        {color === c && <Check size={14} aria-hidden="true" />}
                      </span>
                      <span className="pd-swatch__label">{c}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Purchase */}
            <div className="pd-buy">
              <div className="pd-qty" role="group" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={outOfStock || quantity <= 1}
                  aria-label="Decrease quantity">
                  <Minus size={16} aria-hidden="true" />
                </button>
                <output aria-live="polite" aria-label="Selected quantity">
                  {outOfStock ? 0 : quantity}
                </output>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(view.stock, q + 1))
                  }
                  disabled={outOfStock || atMax}
                  aria-label="Increase quantity">
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                className={`pd-btn pd-buy__cart ${inCart ? "pd-btn--remove" : "pd-btn--primary"}`}
                onClick={handleAddToCart}
                disabled={
                  cartPending || (!inCart && (outOfStock || !view.hasPrice))
                }
                aria-busy={cartPending}>
                {cartPending ? (
                  <Loader2 size={18} className="pd-spin" aria-hidden="true" />
                ) : inCart ? (
                  <Trash2 size={18} aria-hidden="true" />
                ) : (
                  <ShoppingCart size={18} aria-hidden="true" />
                )}
                {cartPending
                  ? inCart
                    ? "Removing…"
                    : "Adding…"
                  : inCart
                    ? "Remove from cart"
                    : outOfStock
                      ? "Out of stock"
                      : "Add to cart"}
              </button>

              <button
                type="button"
                className={`pd-wish ${wished ? "is-active" : ""}`}
                onClick={handleWishlist}
                disabled={wishBusy}
                aria-pressed={wished}
                aria-busy={wishBusy}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                title={wished ? "Remove from wishlist" : "Add to wishlist"}>
                {wishBusy ? (
                  <Loader2 size={20} className="pd-spin" aria-hidden="true" />
                ) : (
                  <Heart
                    size={20}
                    fill={wished ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>

            {atMax && !outOfStock && view.stock > 1 && (
              <p className="pd-hint">
                You've selected the maximum available quantity.
              </p>
            )}

            <div className="pd-feedback" aria-live="polite" role="status">
              {feedback && (
                <p
                  className={`pd-feedback__msg pd-feedback__msg--${feedback.type}`}>
                  {feedback.type === "success" ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <AlertCircle size={16} aria-hidden="true" />
                  )}
                  {feedback.message}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Tabs */}
        <section className="pd-tabs" aria-label="Product details">
          <div
            className="pd-tabs__list"
            role="tablist"
            aria-label="Product sections"
            onKeyDown={onTabKeyDown}>
            {TABS.map((t) => (
              <button
                key={t.key}
                id={`pd-tab-${t.key}`}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`pd-panel-${t.key}`}
                tabIndex={tab === t.key ? 0 : -1}
                className={`pd-tabs__tab ${tab === t.key ? "is-active" : ""}`}
                onClick={() => setTab(t.key)}>
                {t.label}
                {t.key === "reviews" && view.ratingsQuantity > 0 && (
                  <span className="pd-tabs__count">{view.ratingsQuantity}</span>
                )}
              </button>
            ))}
          </div>

          <div
            id={`pd-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`pd-tab-${tab}`}
            className="pd-tabs__panel"
            tabIndex={0}>
            {tab === "description" && (
              <div className="pd-prose">
                {product.description ? (
                  product.description
                    .split(/\n{2,}/)
                    .map((para, i) => <p key={i}>{para}</p>)
                ) : (
                  <p>No description has been provided for this product.</p>
                )}
              </div>
            )}

            {tab === "reviews" && (
              <div>
                {view.ratingsQuantity > 0 && (
                  <div className="pd-reviews__summary">
                    <span className="pd-reviews__score">
                      {view.ratingsAverage.toFixed(1)}
                    </span>
                    <div>
                      <RatingStars
                        value={view.ratingsAverage}
                        count={view.ratingsQuantity}
                      />
                      <span className="pd-reviews__sub">
                        Based on {view.ratingsQuantity} ratings
                      </span>
                    </div>
                  </div>
                )}
                <ReviewForm
                  productId={product._id}
                  hasReviewed={Boolean(
                    isAuthenticated &&
                    user?._id &&
                    reviewsState.items.some(
                      (r) => r.userId && String(r.userId) === String(user._id),
                    ),
                  )}
                  onCreated={handleReviewCreated}
                />
                <Reviews state={reviewsState} />
              </div>
            )}

            {tab === "info" && (
              <dl className="pd-specs">
                {infoRows.map(([label, value]) => (
                  <div key={label} className="pd-specs__row">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        <RelatedProducts products={related} />
      </div>
    </main>
  );
}
