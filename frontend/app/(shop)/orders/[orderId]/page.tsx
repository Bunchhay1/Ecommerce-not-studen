"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { MOCK_ORDERS } from "@/lib/api/mockData";
import { formatCurrency, formatDate, formatOrderStatus } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [shippingData, setShippingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await api.orders.get(orderId);
        if (res?.data) {
          const raw = res.data;
          const addr = (raw.addresses && raw.addresses[0]) || {};
          const mapped = {
            id: raw.id,
            orderNumber: raw.orderNumber || `ORD-${raw.id.substring(0, 8).toUpperCase()}`,
            status: raw.status || "PROCESSING",
            createdAt: raw.createdAt
              ? typeof raw.createdAt === "number" && raw.createdAt < 10000000000
                ? new Date(raw.createdAt * 1000).toISOString()
                : new Date(raw.createdAt).toISOString()
              : new Date().toISOString(),
            subtotal: raw.subtotal ?? 0,
            discount: raw.discount ?? 0,
            shippingFee: raw.shippingFee ?? 0,
            tax: raw.tax ?? 0,
            totalAmount: raw.total ?? raw.totalAmount ?? 0,
            paymentMethod: raw.paymentMethod || "CARD",
            paymentStatus: raw.paymentStatus || "PENDING",
            shippingStatus: raw.shippingStatus || "NOT_STARTED",
            tracking: {
              carrier: "VET Express / J&T",
              trackingNumber: raw.reservationId ? `VET-${raw.reservationId.substring(0, 8).toUpperCase()}` : "KH-TRK-889102",
              estimatedDelivery: "1-2 Business Days",
            },
            shippingAddress: {
              fullName: addr.fullName || "Sok Dara",
              street: addr.addressLine1 || "Street 214, Samdach Pan Ave",
              city: addr.city || "Phnom Penh",
              state: addr.province || "Phnom Penh",
              postalCode: addr.postalCode || "12000",
              phone: addr.phone || "+855 12 888 999",
            },
            items: (raw.items || []).map((it: any) => ({
              id: it.id,
              title: it.productName || it.title || "Marketplace Product",
              image: it.imageUrl || it.image || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
              quantity: it.quantity || 1,
              price: it.unitPrice || it.price || 0,
            })),
          };
          setOrder(mapped);

          // Try fetching shipping info
          try {
            const shipRes = await api.shipping.getByOrder(orderId);
            if (shipRes?.data) {
              setShippingData(shipRes.data);
            }
          } catch {
            // Non-fatal
          }
          return;
        }
      } catch (e) {
        console.warn("Could not fetch remote order, using fallback mock:", e);
      }
      const fallback = MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];
      setOrder(fallback);
    }

    loadOrder().finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading || !order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Tracking order status...</p>
      </div>
    );
  }

  const statusInfo = formatOrderStatus(order.status);
  const isDelivered = order.status === "DELIVERED";
  const isShipped = isDelivered || order.status === "SHIPPED";
  const isProcessing = isShipped || order.status === "PROCESSING";
  const isPaid = order.paymentStatus === "PAID" || isProcessing;

  const trackingSteps = [
    { label: "Order Placed", desc: "Authorized through Go Gateway (:8000)", completed: true },
    { label: "Stock Reserved", desc: "Inventory Service (:8006)", completed: true },
    { label: "Payment Confirmed", desc: "Settled via Payment Service (:8008)", completed: isPaid, active: !isPaid },
    { label: "Processing & Boxing", desc: "Warehouse dispatch prep", completed: isProcessing, active: isPaid && !isProcessing },
    { label: "Shipped", desc: "VET Express / J&T Courier", completed: isShipped, active: isProcessing && !isShipped },
    { label: "Delivered", desc: "Recipient signature received", completed: isDelivered, active: isShipped && !isDelivered },
  ];

  const totalKHR = Math.round(order.totalAmount * 4100).toLocaleString();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back link */}
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all orders
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">{order.orderNumber}</h1>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Placed on {formatDate(order.createdAt)} • Tracking #{order.tracking?.trackingNumber}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" className="text-xs gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> VET Express Tracker
          </Button>
        </div>
      </div>

      {/* Live Shipping Timeline Component */}
      <div className="rounded-3xl border border-primary/20 bg-card/60 p-8 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Live Shipment Tracker (Shipping Service #09 & Order Service #07)
          </h2>
          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Estimated Delivery: {order.tracking?.estimatedDelivery || "1-2 Days"}
          </span>
        </div>

        {/* Stepper bar */}
        <div className="relative pt-4 pb-2">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {trackingSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center space-y-2"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all ${
                    step.active
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : step.completed
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{step.label}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Items list */}
        <div className="rounded-3xl border border-border/70 bg-card/60 p-6 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Ordered Items ({order.items.length})
          </h3>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.title} className="h-14 w-14 rounded-xl object-cover bg-muted" />
                <div className="flex-1">
                  <h4 className="text-xs font-semibold line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="text-xs font-bold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal || order.totalAmount)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-500 font-medium">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border/40">
              <span>Total Paid</span>
              <div className="text-right">
                <span className="text-primary block">{formatCurrency(order.totalAmount)}</span>
                <span className="text-[10px] font-normal text-muted-foreground">≈ ៛{totalKHR} KHR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Destination & Payment info */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Delivery Address (Cambodia Local)
            </h3>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Payment Authorization & Escrow
            </h3>
            <p className="text-xs text-muted-foreground">
              Method: <strong className="text-foreground uppercase">{order.paymentMethod}</strong> • Status: <strong className="text-foreground uppercase">{order.paymentStatus}</strong>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Protected by Buyer Protection Escrow until shipment confirmation is verified by recipient.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
