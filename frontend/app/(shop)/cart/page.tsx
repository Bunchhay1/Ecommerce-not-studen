"use client";

import React from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Your shopping cart is empty</h1>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Explore our catalog to find laptops, smartphones, and audio gear.
        </p>
        <Link href="/products">
          <Button className="mt-2">Browse All Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-black tracking-tight">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground mt-1">Review your items before proceeding to express checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.title} className="h-20 w-20 rounded-2xl object-cover bg-muted" />

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.title}</h3>
                {item.attributes && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Object.values(item.attributes).join(" • ")}
                  </p>
                )}
                <div className="font-bold text-primary text-sm mt-1">{formatCurrency(item.price)}</div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1">
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => removeItem(item.variantId)}
                className="text-muted-foreground hover:text-rose-500 p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div>
          <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-base font-bold">Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-emerald-500 font-semibold">Free</span>
              </div>
              <div className="flex justify-between text-base font-black text-foreground pt-3 border-t border-border/40">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block w-full pt-2">
              <Button size="lg" className="w-full gap-2 font-bold shadow-xl shadow-primary/25">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
