import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../services/wishlistService";

import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

const toIds = (list) =>
  (Array.isArray(list) ? list : [])
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return null;

      const product = item.product;

      if (product) {
        return typeof product === "object"
          ? product._id || product.id
          : product;
      }

      return item._id || item.id;
    })
    .filter(Boolean)
    .map(String);

const extractList = (response) => {
  const body = response?.data;

  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.wishlist)) return body.wishlist;
  if (Array.isArray(body)) return body;

  return null;
};

export function WishlistProvider({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // أقفال متزامنة لمنع تكرار طلب المنتج نفسه
  const pendingRef = useRef(new Set());

  // منع الطلبات القديمة من الكتابة فوق حالة أحدث
  const requestIdRef = useRef(0);

  const refreshWishlist = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!isAuthenticated) {
      setWishlistIds([]);
      setWishlistLoading(false);
      return [];
    }

    if (Array.isArray(user?.wishlist)) {
      setWishlistIds(toIds(user.wishlist));
    }

    setWishlistLoading(true);

    try {
      const response = await getWishlist();

      if (requestId !== requestIdRef.current) return [];

      const list = extractList(response);

      if (list === null) {
        throw new Error("Unexpected wishlist response");
      }

      const ids = toIds(list);
      setWishlistIds(ids);

      return ids;
    } catch (error) {
      if (requestId !== requestIdRef.current) return [];

      if (error?.response?.status === 404) {
        setWishlistIds([]);
        return [];
      }

      throw error;
    } finally {
      if (requestId === requestIdRef.current) {
        setWishlistLoading(false);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (authLoading) return;

    refreshWishlist().catch((error) => {
      console.error("Failed to load wishlist:", error);
    });

    return () => {
      // تجاهل أي استجابة تخص جلسة تحميل قديمة
      requestIdRef.current++;
    };
  }, [authLoading, refreshWishlist]);

  const isInWishlist = useCallback(
    (productId) => wishlistIds.includes(String(productId)),
    [wishlistIds],
  );

  const addItem = useCallback(
    async (productId) => {
      const id = String(productId);

      if (pendingRef.current.has(id)) return;

      // لا ترسل طلب إضافة إذا كان المنتج موجودًا بالفعل
      if (isInWishlist(id)) return;

      pendingRef.current.add(id);

      // تحديث فوري
      setWishlistIds((current) =>
        current.includes(id) ? current : [...current, id],
      );

      try {
        await addToWishlist(id);
      } catch (error) {
        // Rollback للمنتج المتأثر فقط
        setWishlistIds((current) => current.filter((itemId) => itemId !== id));

        throw error;
      } finally {
        pendingRef.current.delete(id);
      }
    },
    [isInWishlist],
  );

  const removeItem = useCallback(
    async (productId) => {
      const id = String(productId);

      if (pendingRef.current.has(id)) return;

      if (!isInWishlist(id)) return;

      pendingRef.current.add(id);

      // احفظ الحالة السابقة لاسترجاعها عند الفشل
      setWishlistIds((current) => current.filter((itemId) => itemId !== id));

      try {
        await removeFromWishlist(id);
      } catch (error) {
        setWishlistIds((current) =>
          current.includes(id) ? current : [...current, id],
        );

        throw error;
      } finally {
        pendingRef.current.delete(id);
      }
    },
    [isInWishlist],
  );

  const value = useMemo(
    () => ({
      wishlistIds,
      wishlistCount: wishlistIds.length,
      wishlistLoading,
      isInWishlist,
      addItem,
      removeItem,
      refreshWishlist,

      isWishlistPending: (id) => pendingRef.current.has(String(id)),
    }),
    [
      wishlistIds,
      wishlistLoading,
      isInWishlist,
      addItem,
      removeItem,
      refreshWishlist,
    ],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
}
