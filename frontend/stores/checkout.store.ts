import { create } from "zustand";
import { ShippingAddress } from "@/types/order";

export type CambodiaPaymentMethod =
  | "bakong_khqr"
  | "aba_payway"
  | "wing"
  | "acleda"
  | "card"
  | "cod";

interface CheckoutState {
  step: 1 | 2 | 3;
  shippingAddress: ShippingAddress;
  paymentMethod: CambodiaPaymentMethod;
  couponCode: string;
  discount: number;
  setStep: (step: 1 | 2 | 3) => void;
  setShippingAddress: (addr: Partial<ShippingAddress>) => void;
  setPaymentMethod: (method: CambodiaPaymentMethod) => void;
  applyCoupon: (code: string, subtotal?: number) => boolean;
  removeCoupon: () => void;
  resetCheckout: () => void;
}

const defaultAddress: ShippingAddress = {
  id: "addr-kh-default",
  fullName: "Sok Dara",
  street: "Building 42, Street 214 (Samdach Pan Ave)",
  city: "Daun Penh",
  state: "Phnom Penh",
  postalCode: "12000",
  country: "Cambodia",
  phone: "+855 12 888 999",
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: 1,
  shippingAddress: defaultAddress,
  paymentMethod: "bakong_khqr",
  couponCode: "",
  discount: 0,

  setStep: (step) => set({ step }),

  setShippingAddress: (addr) =>
    set((state) => ({
      shippingAddress: { ...state.shippingAddress, ...addr },
    })),

  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  applyCoupon: (code, subtotal = 100) => {
    const clean = code.trim().toUpperCase();
    if (clean === "SAVE10" || clean === "FALL2026") {
      set({ couponCode: clean, discount: Math.round(subtotal * 0.1) || 20 });
      return true;
    }
    if (clean === "KNY2026") {
      set({ couponCode: clean, discount: Math.round(subtotal * 0.15) || 35 });
      return true;
    }
    return false;
  },

  removeCoupon: () => set({ couponCode: "", discount: 0 }),

  resetCheckout: () =>
    set({
      step: 1,
      shippingAddress: defaultAddress,
      paymentMethod: "bakong_khqr",
      couponCode: "",
      discount: 0,
    }),
}));
