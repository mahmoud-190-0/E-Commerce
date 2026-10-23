import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getCart, addToCart, removeCartItem } from "../services/cartService";

import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const getProductId = (item) => {
  const getId = (value) =>
    value && typeof value === "object" ? (value._id ?? value.id) : value;

  return String(getId(item?.product) ?? getId(item?.productId) ?? "");
};

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  // قفل متزامن لكل منتج
  const pendingRef = useRef(new Set());

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setCartLoading(false);
      return null;
    }

    setCartLoading(true);

    try {
      const response = await getCart();
      const cartData = response?.data?.data ?? null;

      setCart(cartData);
      return cartData;
    } catch (error) {
      if (error?.response?.status === 404) {
        setCart(null);
        return null;
      }

      throw error;
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;

    refreshCart().catch((error) => {
      console.error("Failed to load cart:", error);
    });
  }, [authLoading, refreshCart]);

  const addItemToCart = useCallback(
    async (product, quantity = 1) => {
      const productId = String(product?._id ?? "");

      if (!productId || quantity < 1) return;

      if (pendingRef.current.has(productId)) return;

      pendingRef.current.add(productId);

      // احتفظ بالمنتج وحالته السابقة للـ rollback
      const previousItems = cart?.cartItems ?? [];
      const previousItem = previousItems.find(
        (item) => getProductId(item) === productId,
      );

      setCart((current) => {
        const currentItems = current?.cartItems ?? [];
        const exists = currentItems.some(
          (item) => getProductId(item) === productId,
        );

        const cartItems = exists
          ? currentItems.map((item) =>
              getProductId(item) === productId
                ? {
                    ...item,
                    quantity: (Number(item.quantity) || 0) + quantity,
                  }
                : item,
            )
          : [
              ...currentItems,
              {
                product,
                quantity,
                price:
                  Number(product.priceAfterDiscount) ||
                  Number(product.price) ||
                  0,
              },
            ];

        return {
          ...(current ?? {}),
          cartItems,
        };
      });

      try {
        // يجب أن يطابق شكل الـ payload الذي يتوقعه Backend
        await addToCart({
          productId,
          quantity,
        });
      } catch (error) {
        setCart((current) => {
          if (!current) return current;

          const currentItems = current.cartItems ?? [];

          const cartItems = previousItem
            ? currentItems.map((item) =>
                getProductId(item) === productId ? previousItem : item,
              )
            : currentItems.filter((item) => getProductId(item) !== productId);

          return {
            ...current,
            cartItems,
          };
        });

        throw error;
      } finally {
        pendingRef.current.delete(productId);
      }
    },
    [cart],
  );

  const removeItem = useCallback(
    async (productId) => {
      const id = String(productId);

      if (pendingRef.current.has(id)) return;

      const currentItems = cart?.cartItems ?? [];
      const previousItem = currentItems.find(
        (item) => getProductId(item) === id,
      );

      if (!previousItem) return;

      pendingRef.current.add(id);

      // حذف فوري من الواجهة
      setCart((current) => ({
        ...current,
        cartItems: (current?.cartItems ?? []).filter(
          (item) => getProductId(item) !== id,
        ),
      }));

      try {
        await removeCartItem(id);
      } catch (error) {
        setCart((current) => {
          const items = current?.cartItems ?? [];

          if (items.some((item) => getProductId(item) === id)) {
            return current;
          }

          return {
            ...(current ?? {}),
            cartItems: [...items, previousItem],
          };
        });

        throw error;
      } finally {
        pendingRef.current.delete(id);
      }
    },
    [cart],
  );

  const cartItems = cart?.cartItems ?? [];

  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        cartCount,
        cartLoading,
        refreshCart,
        addItemToCart,
        removeItem,
        isCartPending: (id) => pendingRef.current.has(String(id)),
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
