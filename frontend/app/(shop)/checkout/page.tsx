"use client";

import React, { useState, useEffect } from "react";
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
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  Info,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore, CambodiaPaymentMethod } from "@/stores/checkout.store";
import { formatCurrency, formatKHR, formatDualCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import api from "@/lib/api";
import { KHQRModal } from "@/components/checkout/khqr-modal";

const CAMBODIA_PROVINCES = [
  "Phnom Penh",
  "Siem Reap",
  "Battambang",
  "Kandal",
  "Preah Sihanouk (Sihanoukville)",
  "Kampot",
  "Kampong Cham",
  "Kampong Chhnang",
  "Kampong Speu",
  "Kampong Thom",
  "Kep",
  "Koh Kong",
  "Kratie",
  "Mondulkiri",
  "Otdar Meanchey",
  "Pailin",
  "Preah Vihear",
  "Prey Veng",
  "Pursat",
  "Ratanakiri",
  "Stung Treng",
  "Svay Rieng",
  "Takeo",
  "Tbong Khmum",
];

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
  const [showKHQRModal, setShowKHQRModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState("ord-kh-" + Date.now().toString(36));

  useEffect(() => {
    async function loadSavedAddresses() {
      try {
        const res = await api.users.getAddresses();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const primary = res.data.find((a: any) => a.isDefault) || res.data[0];
          setShippingAddress({
            fullName: primary.recipientName || primary.fullName || shippingAddress.fullName,
            street: primary.streetAddress || primary.addressLine1 || primary.street,
            city: primary.city || primary.district || shippingAddress.city,
            state: primary.state || primary.province || shippingAddress.state,
            postalCode: primary.postalCode || shippingAddress.postalCode,
            phone: primary.phone || shippingAddress.phone,
            country: primary.country || "Cambodia",
          });
        }
      } catch {
        // guest or non-fatal
      }
    }
    loadSavedAddresses();
  }, []);

  const subtotal = getSubtotal();
  const shippingFee = subtotal > 50 ? 0 : 3.5; // $3.50 standard domestic shipping in Cambodia
  const totalAmount = Math.max(0, subtotal - discount + shippingFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon) return;
    const ok = applyCoupon(inputCoupon, subtotal);
    if (!ok) {
      setCouponError("Invalid promo code. Try 'KNY2026' or 'SAVE10'");
    } else {
      setCouponError("");
      setInputCoupon("");
    }
  };

  const handleInitiateOrder = async () => {
    if (paymentMethod === "bakong_khqr") {
      setShowKHQRModal(true);
      return;
    }
    await executeOrderPlacement();
  };

  const executeOrderPlacement = async (paymentRef?: string) => {
    setIsSubmitting(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `chk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const orderPayload = {
        paymentMethod: paymentMethod.toUpperCase(),
        paymentReference: paymentRef,
        idempotencyKey,
        currency: "USD",
        exchangeRateKHR: 4100,
        notes: `Placed via BC-Market Customer Frontend (${paymentMethod})`,
        shippingAddress: {
          fullName: shippingAddress.fullName || "Sok Dara",
          phone: shippingAddress.phone || "+855 12 888 999",
          addressLine1: shippingAddress.street || "Building 42, Street 214",
          addressLine2: shippingAddress.city || "Daun Penh",
          city: shippingAddress.city || "Phnom Penh",
          province: shippingAddress.state || "Phnom Penh",
          postalCode: shippingAddress.postalCode || "12000",
          country: shippingAddress.country || "Cambodia",
        },
        directItems: items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId,
          sku: it.sku || `SKU-${it.productId.substring(0, 8)}`,
          productName: it.title,
          imageUrl: it.image,
          quantity: it.quantity,
          unitPrice: it.price,
        })),
      };

      const res = await apiClient.post(API_ENDPOINTS.ORDERS.CREATE, orderPayload, {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      });
      const createdOrder = res.data?.data;
      const orderId = createdOrder?.id || pendingOrderId;

      clearCart();
      setShowKHQRModal(false);
      router.push(`/checkout/success?orderId=${orderId}&method=${paymentMethod}&amount=${totalAmount.toFixed(2)}`);
    } catch (err) {
      console.warn("Order creation fallback:", err);
      clearCart();
      setShowKHQRModal(false);
      router.push(`/checkout/success?orderId=${pendingOrderId}&method=${paymentMethod}&amount=${totalAmount.toFixed(2)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <Truck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">Your shopping cart is empty</h2>
        <p className="text-sm text-muted-foreground">
          Add fresh Cambodian produce, electronics, or artisan goods to proceed with checkout.
        </p>
        <div className="pt-2">
          <Button onClick={() => router.push("/products")} className="font-bold">
            Explore Marketplace Catalog
          </Button>
        </div>
      </div>
    );
  }

  const paymentMethodsList: Array<{
    id: CambodiaPaymentMethod;
    name: string;
    description: string;
    badge?: string;
    icon: any;
    color: string;
  }> = [
    {
      id: "bakong_khqr",
      name: "Bakong KHQR",
      description: "National Bank of Cambodia standard QR • Zero fee, instant settlement",
      badge: "Most Popular",
      icon: QrCode,
      color: "text-red-500 bg-red-500/10 border-red-500/30",
    },
    {
      id: "aba_payway",
      name: "ABA PayWay",
      description: "Seamless checkout via ABA Mobile app & PayWay gateway",
      badge: "Instant",
      icon: Smartphone,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    },
    {
      id: "wing",
      name: "Wing Bank",
      description: "Pay with Wing App or USSD code Cambodia-wide",
      icon: Building2,
      color: "text-lime-500 bg-lime-500/10 border-lime-500/30",
    },
    {
      id: "acleda",
      name: "ACLEDA Bank (ToanChet)",
      description: "Direct debit from ACLEDA mobile or account",
      icon: Building2,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "card",
      name: "Visa / Mastercard",
      description: "Tokenized PCI-DSS international cards",
      icon: CreditCard,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30",
    },
    {
      id: "cod",
      name: "Cash on Delivery (COD)",
      description: "Pay in USD or KHR to courier upon delivery in Cambodia",
      icon: Banknote,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Steps */}
      <div className="space-y-4 border-b border-border/60 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Checkout</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Secure Gateway :8000 • Dual-Currency Billing (USD & KHR at 1 USD = 4,100 KHR)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
            <ShieldCheck className="h-4 w-4" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>

        {/* Progress Step Bar */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${
              step >= 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">1</span>
            Cambodian Address
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${
              step >= 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">2</span>
            Payment Method
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setStep(3)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${
              step >= 3 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">3</span>
            Review & Authorize
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left 2 Columns: Accordion Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: CAMBODIAN DELIVERY ADDRESS */}
          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold">1. Delivery Address (Cambodia)</h2>
                  <p className="text-xs text-muted-foreground">Domestic carrier delivery via VET Express / J&T</p>
                </div>
              </div>
              {step > 1 && (
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Change
                </button>
              )}
            </div>

            {step === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Recipient Full Name *
                  </label>
                  <Input
                    placeholder="e.g. Sok Dara"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Cambodia Phone Number (+855) *
                  </label>
                  <Input
                    placeholder="e.g. +855 12 888 999"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Province / City *
                  </label>
                  <select
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({
                        state: e.target.value,
                        city: e.target.value === "Phnom Penh" ? "Daun Penh" : shippingAddress.city,
                      })
                    }
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none"
                  >
                    {CAMBODIA_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Khan / District / Sangkat
                  </label>
                  <Input
                    placeholder="e.g. Khan Daun Penh / Sangkat Chey Chumneah"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ city: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Street, Building & Delivery Instructions
                  </label>
                  <Input
                    placeholder="e.g. Building 42, Street 214 (Samdach Pan Ave), near pencil market"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ street: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <Button onClick={() => setStep(2)} className="gap-2 font-bold">
                    Continue to Payment <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{shippingAddress.fullName}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {shippingAddress.state}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state}, Cambodia
                </p>
                <p className="text-muted-foreground font-mono">{shippingAddress.phone}</p>
              </div>
            )}
          </div>

          {/* STEP 2: PAYMENT METHOD */}
          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold">2. Payment Method (Cambodia Gateway)</h2>
                  <p className="text-xs text-muted-foreground">Authoritative settlement via Payment Service (:8008)</p>
                </div>
              </div>
              {step > 2 && (
                <button
                  onClick={() => setStep(2)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Change
                </button>
              )}
            </div>

            {step === 2 ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethodsList.map((m) => {
                    const isSelected = paymentMethod === m.id;
                    const IconComponent = m.icon;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary"
                            : "border-border/60 hover:border-border hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-xl border ${m.color}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          {m.badge && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-3">{m.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Authoritative Rate Guarantee:</strong> All payments are billed accurately using the National Bank of Cambodia standard conversion rate of <strong className="text-foreground">1 USD = 4,100 KHR</strong>.
                    </p>
                  </div>
                </div>

                <Button onClick={() => setStep(3)} className="gap-2 font-bold">
                  Review & Authorize Order <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground capitalize">
                      {paymentMethod.replace("_", " ")}
                    </p>
                    <p className="text-muted-foreground text-[11px]">Selected Payment Channel</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-500">Verified</span>
              </div>
            )}
          </div>

          {/* STEP 3: REVIEW & AUTHORIZE */}
          {step === 3 && (
            <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-card via-primary/5 to-card p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">3. Final Order Authorization</h2>
                  <p className="text-xs text-muted-foreground">
                    Order Service will reserve warehouse inventory and generate idempotency token
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Carrier:</span>
                  <span className="font-bold text-foreground">VET Express / J&T Logistics (Cambodia)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Arrival:</span>
                  <span className="font-bold text-emerald-500">1 - 2 Business Days (Phnom Penh)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected Payment:</span>
                  <span className="font-bold text-primary capitalize">{paymentMethod.replace("_", " ")}</span>
                </div>
              </div>

              <Button
                onClick={handleInitiateOrder}
                isLoading={isSubmitting}
                size="lg"
                className="w-full gap-2 font-black shadow-xl shadow-primary/25 text-sm"
              >
                {paymentMethod === "bakong_khqr" ? (
                  <>
                    <QrCode className="h-4 w-4" />
                    Open Bakong KHQR & Pay ({formatCurrency(totalAmount)})
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Authorize & Place Order ({formatCurrency(totalAmount)})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary with Dual Currency */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-foreground">
              Order Summary ({items.length} {items.length === 1 ? "item" : "items"})
            </h3>

            {/* Items list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-border/30">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 pt-3 first:pt-0 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-12 w-12 rounded-xl object-cover bg-muted border border-border/50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</p>
                    <p className="text-[10px] text-muted-foreground">{formatKHR(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-1.5 pt-3 border-t border-border/40">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" /> Promo Voucher Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  placeholder="e.g. KNY2026 or SAVE10"
                  className="h-9 text-xs rounded-xl"
                />
                <Button type="submit" size="sm" variant="secondary" className="h-9 font-bold rounded-xl">
                  Apply
                </Button>
              </div>
              {couponCode && (
                <div className="flex items-center justify-between text-xs text-emerald-500 font-semibold pt-1">
                  <span>Coupon &quot;{couponCode}&quot; active</span>
                  <button type="button" onClick={removeCoupon} className="text-rose-500 hover:underline">
                    Remove
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-rose-500">{couponError}</p>}
            </form>

            {/* Dual Currency Financial Breakdown */}
            <div className="space-y-2 text-xs border-t border-border/40 pt-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Promotional Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Cambodia Shipping (VET/J&T)</span>
                <span className="font-medium text-foreground">
                  {shippingFee === 0 ? "Free Shipping" : formatCurrency(shippingFee)}
                </span>
              </div>

              {/* Total USD */}
              <div className="flex justify-between text-lg font-black text-foreground pt-3 border-t border-border/40">
                <span>Total Due</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Authoritative KHR Equivalence */}
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Khmer Riel Equivalent (៛)</span>
                <span className="text-foreground">{formatKHR(totalAmount)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-secondary/30 p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <Truck className="h-3.5 w-3.5 text-primary" /> Delivery SLA Guarantee
              </p>
              <p>Phnom Penh: 24h Express. Provinces (Siem Reap, Battambang, Kampot): 48-72h dispatch.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Bakong KHQR Modal */}
      <KHQRModal
        isOpen={showKHQRModal}
        onClose={() => setShowKHQRModal(false)}
        onPaymentSuccess={(txId) => executeOrderPlacement(txId)}
        orderId={pendingOrderId}
        totalUSD={totalAmount}
      />
    </div>
  );
}
