"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl border-l border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 p-5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Shopping Cart ({items.length})</h2>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={closeCart}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-3">
                  <div className="rounded-full bg-muted p-4">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold">Your cart is empty</h3>
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    Looks like you haven&apos;t added any items to your shopping cart yet.
                  </p>
                  <Button size="sm" onClick={closeCart} className="mt-2">
                    Start Shopping
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex gap-4 rounded-xl border border-border/50 bg-background/50 p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-20 w-20 rounded-lg object-cover bg-muted"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold line-clamp-1">{item.title}</h4>
                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {item.attributes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Object.values(item.attributes).join(" • ")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(item.price)}
                        </span>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-0.5">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout Button */}
            {items.length > 0 && (
              <div className="border-t border-border/60 bg-muted/20 p-5 space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Shipping</span>
                    <span className="text-emerald-500 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-border/40">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <Link href="/checkout" onClick={closeCart} className="block w-full">
                  <Button className="w-full gap-2 font-bold shadow-lg shadow-primary/20">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
