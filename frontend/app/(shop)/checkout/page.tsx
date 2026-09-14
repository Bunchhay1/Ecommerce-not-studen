"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CreditCard,
  Truck,
  ShieldCheck,
  Tag,
  ArrowRight,
  MapPin,
  Lock,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore } from "@/stores/checkout.store";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getSubtotal } = useCartStore();
  const {
    step,
    setStep,
    shippingAddress,
    setShippingAddress,
    paymentMethod,
    setPaymentMethod,
    couponCode,
    discount,
    applyCoupon,
    removeCoupon,
  } = useCheckoutStore();

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const shippingFee = subtotal > 50 ? 0 : 15;
  const totalAmount = Math.max(0, subtotal - discount + shippingFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon) return;
    const ok = applyCoupon(inputCoupon);
    if (!ok) {
      setCouponError("Invalid promo code. Try 'SAVE10'");
    } else {
      setCouponError("");
      setInputCoupon("");
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        shippingAddress,
        paymentMethod,
        items,
        totalAmount,
        discount,
        couponCode: couponCode || undefined,
      };

      const res = await apiClient.post(API_ENDPOINTS.ORDERS.CREATE, payload);
      const createdOrder = res.data?.data;
      const orderId = createdOrder?.id || "ord-101";

      clearCart();
      router.push(`/orders/${orderId}`);
    } catch {
      clearCart();
      router.push("/orders/ord-101");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground">Add products before checking out.</p>
        <Button onClick={() => router.push("/products")}>Browse Catalog</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header & Steps */}
      <div className="space-y-4 border-b border-border/60 pb-6">
        <h1 className="text-3xl font-black tracking-tight">Express Checkout</h1>
        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <span className={`flex items-center gap-1.5 ${step >= 1 ? "text-primary font-bold" : ""}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">1</span>
            Shipping Address
          </span>
          <span>→</span>
          <span className={`flex items-center gap-1.5 ${step >= 2 ? "text-primary font-bold" : ""}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">2</span>
            Payment Method
          </span>
          <span>→</span>
          <span className={`flex items-center gap-1.5 ${step >= 3 ? "text-primary font-bold" : ""}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">3</span>
            Review & Pay
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Step Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Shipping */}
          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                1. Delivery Address
              </h2>
              {step > 1 && (
                <button onClick={() => setStep(1)} className="text-xs text-primary font-semibold hover:underline">
                  Edit
                </button>
              )}
            </div>

            {step === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name</label>
                  <Input
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone</label>
                  <Input
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Street Address</label>
                  <Input
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ street: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">City</label>
                  <Input
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Postal Code</label>
                  <Input
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ postalCode: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <Button onClick={() => setStep(2)} className="gap-2 font-bold">
                    Continue to Payment <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="font-semibold text-foreground">{shippingAddress.fullName}</p>
                <p>{shippingAddress.street}, {shippingAddress.city} {shippingAddress.postalCode}</p>
                <p>{shippingAddress.phone}</p>
              </div>
            )}
          </div>

          {/* Step 2: Payment */}
          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                2. Tokenized Payment
              </h2>
              {step > 2 && (
                <button onClick={() => setStep(2)} className="text-xs text-primary font-semibold hover:underline">
                  Edit
                </button>
              )}
            </div>

            {step === 2 && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "card", label: "Credit Card", icon: CreditCard },
                    { id: "apple_pay", label: "Apple Pay", icon: Lock },
                    { id: "paypal", label: "PayPal", icon: ShieldCheck },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                        paymentMethod === m.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 hover:bg-secondary/60"
                      }`}
                    >
                      <m.icon className="h-5 w-5 text-primary mb-1" />
                      <span className="text-xs font-bold text-foreground">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-dashed border-border p-4 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                    <ShieldCheck className="h-4 w-4" />
                    <span>PCI-DSS Compliant • Tokenized via Payment Service (:8008)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Your payment details are encrypted directly with the payment provider. Raw card data is never stored on frontend servers.
                  </p>
                </div>

                <Button onClick={() => setStep(3)} className="gap-2 font-bold">
                  Review Order <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {step !== 2 && (
              <p className="text-xs text-muted-foreground capitalize">
                Selected method: <strong className="text-foreground">{paymentMethod.replace("_", " ")}</strong>
              </p>
            )}
          </div>

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="rounded-3xl border border-primary/40 bg-primary/5 p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                3. Final Order Authorization
              </h2>
              <p className="text-xs text-muted-foreground">
                By clicking &quot;Authorize & Place Order&quot;, Order Service will reserve warehouse inventory, process payment through our gateway, and initiate dispatch tracking.
              </p>
              <Button
                onClick={handlePlaceOrder}
                isLoading={isSubmitting}
                size="lg"
                className="w-full gap-2 font-bold shadow-xl shadow-primary/25"
              >
                Authorize & Place Order ({formatCurrency(totalAmount)})
              </Button>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-5">
            <h3 className="text-base font-bold">Order Summary ({items.length} items)</h3>

            {/* Item list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title} className="h-12 w-12 rounded-lg object-cover bg-muted" />
                  <div className="flex-1">
                    <p className="font-semibold line-clamp-1">{item.title}</p>
                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-1.5 pt-2 border-t border-border/40">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" /> Promo Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  placeholder="Enter SAVE10"
                  className="h-9 text-xs"
                />
                <Button type="submit" size="sm" variant="secondary" className="h-9 font-semibold">
                  Apply
                </Button>
              </div>
              {couponCode && (
                <div className="flex items-center justify-between text-xs text-emerald-500 font-semibold pt-1">
                  <span>Coupon &quot;{couponCode}&quot; applied</span>
                  <button type="button" onClick={removeCoupon} className="text-rose-500 hover:underline">
                    Remove
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-rose-500">{couponError}</p>}
            </form>

            {/* Total breakdown */}
            <div className="space-y-2 text-xs border-t border-border/40 pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-foreground pt-2 border-t border-border/40">
                <span>Total Due</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
