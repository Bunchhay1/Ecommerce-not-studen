import { create } from "zustand";
import { CartItem } from "@/types/cart";
import { Product, ProductVariant } from "@/types/product";

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
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [
    {
      id: "cart-item-1",
      productId: "prod-1",
      variantId: "v1-1",
      title: "QuantumPro Phone 17 Max Titanium",
      sku: "QP17-256-BLK",
      price: 1199.00,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&auto=format&fit=crop&q=80",
      attributes: { color: "Space Black", storage: "256GB" },
      maxStock: 45,
    },
  ],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  addItem: (product: Product, variant?: ProductVariant, quantity = 1) => {
    const selectedVariant = variant || product.variants[0];
    const variantId = selectedVariant?.id || product.id;

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
    set((state) => ({
      items: state.items.filter((i) => i.variantId !== variantId),
    }));
  },

  updateQuantity: (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(variantId);
      return;
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
}));
