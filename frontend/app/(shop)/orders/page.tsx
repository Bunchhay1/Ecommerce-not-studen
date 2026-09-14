"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ArrowRight, Clock, ShieldCheck, ShoppingBag, Loader2 } from "lucide-react";
import { MOCK_ORDERS } from "@/lib/api/mockData";
import { formatCurrency, formatDate, formatOrderStatus } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.orders.list();
        if (res?.data?.items && res.data.items.length > 0) {
          const mapped = res.data.items.map((ord: any) => ({
            id: ord.id,
            orderNumber: ord.orderNumber || `ORD-${ord.id.substring(0, 8).toUpperCase()}`,
            createdAt: ord.createdAt ? (typeof ord.createdAt === "number" && ord.createdAt < 10000000000 ? new Date(ord.createdAt * 1000).toISOString() : new Date(ord.createdAt).toISOString()) : new Date().toISOString(),
            status: ord.status || "PROCESSING",
            totalAmount: ord.total ?? ord.totalAmount ?? 0,
            items: (ord.items || []).map((it: any) => ({
              id: it.id,
              title: it.productName || it.title || "Marketplace Product",
              image: it.imageUrl || it.image || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
              quantity: it.quantity || 1,
              price: it.unitPrice || it.price || 0,
            })),
          }));
          setOrders(mapped);
          return;
        }
      } catch (err) {
        console.warn("Could not load remote orders, falling back to cached seed:", err);
      }
      setOrders(MOCK_ORDERS);
      setIsLoading(false);
    }
    loadOrders().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Loading marketplace orders...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Order History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track dispatches, review items, and manage past marketplace transactions (Order Service #07)
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-bold">No orders placed yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Discover thousands of high-tech products and Cambodian specialty items across Phnom Penh.
          </p>
          <Link href="/products">
            <Button className="font-bold">Explore Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = formatOrderStatus(order.status);
            return (
              <div
                key={order.id}
                className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-6 hover:border-primary/40 transition-all"
              >
                {/* Top metadata */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground block">Order Number</span>
                      <strong className="text-foreground font-bold">{order.orderNumber}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Date Placed</span>
                      <strong className="text-foreground">{formatDate(order.createdAt)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total</span>
                      <strong className="text-primary font-bold">{formatCurrency(order.totalAmount)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <Link href={`/orders/${order.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-semibold">
                        Track Shipment <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.title} className="h-14 w-14 rounded-xl object-cover bg-muted" />
                      <div>
                        <h4 className="text-xs font-semibold text-foreground line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Qty: {item.quantity} • {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
