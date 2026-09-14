import { create } from "zustand";
import { ShippingAddress } from "@/types/order";

interface CheckoutState {
  step: 1 | 2 | 3;
  shippingAddress: ShippingAddress;
  paymentMethod: "card" | "apple_pay" | "paypal";
  couponCode: string;
  discount: number;
  setStep: (step: 1 | 2 | 3) => void;
  setShippingAddress: (addr: Partial<ShippingAddress>) => void;
  setPaymentMethod: (method: "card" | "apple_pay" | "paypal") => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  resetCheckout: () => void;
}

const defaultAddress: ShippingAddress = {
  id: "addr-default",
  fullName: "Alex Rivera",
  street: "742 Evergreen Terrace",
  city: "San Francisco",
  state: "CA",
  postalCode: "94107",
  country: "United States",
  phone: "+1 (555) 382-9102",
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: 1,
  shippingAddress: defaultAddress,
  paymentMethod: "card",
  couponCode: "",
  discount: 0,

  setStep: (step) => set({ step }),

  setShippingAddress: (addr) =>
    set((state) => ({
      shippingAddress: { ...state.shippingAddress, ...addr },
    })),

  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  applyCoupon: (code) => {
    if (code.toUpperCase() === "SAVE10" || code.toUpperCase() === "FALL2026") {
      set({ couponCode: code.toUpperCase(), discount: 50 });
      return true;
    }
    return false;
  },

  removeCoupon: () => set({ couponCode: "", discount: 0 }),

  resetCheckout: () =>
    set({
      step: 1,
      shippingAddress: defaultAddress,
      paymentMethod: "card",
      couponCode: "",
      discount: 0,
    }),
}));
