import { create } from "zustand";
import { CartItem } from "@/types/cart";
import { Product, ProductVariant } from "@/types/product";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  syncWithBackend: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [
    {
      id: "cart-item-1",
      productId: "prd-mbp-m3",
      variantId: "var-mbp-m3",
      title: "MacBook Pro 14 M3 Max (Phnom Penh Hub)",
      sku: "SKU-MBP-14-M3-SB",
      price: 1999.00,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
      attributes: { color: "Space Black", storage: "512GB" },
      maxStock: 23,
    },
  ],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  addItem: (product: Product, variant?: ProductVariant, quantity = 1) => {
    const selectedVariant = variant || product.variants[0];
    const variantId = selectedVariant?.id || product.id;

    // Fire-and-forget sync with backend Cart Service if authenticated
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      apiClient.post(API_ENDPOINTS.CART.ITEMS, {
        productId: product.id,
        variantId,
        quantity,
      }).catch((err) => console.warn("Cart background sync:", err.message));
    }

    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.variantId === variantId);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += quantity;
        return { items: updated, isOpen: true };
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        productId: product.id,
        variantId,
        title: product.title,
        sku: selectedVariant?.sku || product.id,
        price: selectedVariant?.price || product.price,
        quantity,
        image: product.images[0] || product.thumbnail,
        attributes: selectedVariant?.attributes,
        maxStock: selectedVariant?.availableStock || 99,
      };

      return { items: [...state.items, newItem], isOpen: true };
    });
  },

  removeItem: (variantId: string) => {
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      apiClient.delete(API_ENDPOINTS.CART.ITEM(variantId)).catch(() => {});
    }
    set((state) => ({
      items: state.items.filter((i) => i.variantId !== variantId),
    }));
  },

  updateQuantity: (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(variantId);
      return;
    }

    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      apiClient.patch(API_ENDPOINTS.CART.ITEM(variantId), { quantity }).catch(() => {});
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  syncWithBackend: async () => {
    if (typeof window === "undefined" || !localStorage.getItem("accessToken")) return;
    try {
      const res = await apiClient.get(API_ENDPOINTS.CART.GET);
      if (res.data?.data?.items && Array.isArray(res.data.data.items) && res.data.data.items.length > 0) {
        const mapped = res.data.data.items.map((it: any) => ({
          id: it.id || `cart-${it.variantId}`,
          productId: it.productId,
          variantId: it.variantId,
          title: it.title || it.productName || "Cart Item",
          sku: it.sku || it.variantId,
          price: Number(it.price || it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
          image: it.image || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
          maxStock: 50,
        }));
        set({ items: mapped });
      }
    } catch {
      // Keep optimistic items
    }
  },
}));

