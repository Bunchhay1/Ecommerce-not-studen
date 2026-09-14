"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Eye } from "lucide-react";
import { Product } from "@/types/product";
import { PriceTag } from "./price-tag";
import { RatingStars } from "./rating-stars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart.store";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  // Safe extraction of title, brand, category, and image
  const title = product.title || (product as any).name || "Cambodian Product";
  const brandName = typeof product.brand === "object" && product.brand !== null
    ? (product.brand as any).name
    : (product.brand || (typeof product.category === "object" ? (product.category as any)?.name : product.category) || "Authentic Cambodia");

  const imageUrl = Array.isArray(product.images) && product.images.length > 0
    ? (typeof product.images[0] === "object" && product.images[0] !== null ? (product.images[0] as any).url : product.images[0])
    : (product.thumbnail || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80");

  const khrPrice = Math.round((product.price || 0) * 4100).toLocaleString();

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
    >
      {/* Image & Quick Action Header */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Tag badge */}
        {product.tags && product.tags[0] && (
          <div className="absolute left-3 top-3">
            <Badge variant="default" className="text-[11px] font-medium backdrop-blur-md">
              {product.tags[0]}
            </Badge>
          </div>
        )}

        {/* Quick View Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          <Link href={`/products/${product.id}`}>
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="default"
            className="h-9 w-9 rounded-full shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {brandName}
        </span>

        <Link href={`/products/${product.id}`} className="mt-1">
          <h3 className="line-clamp-1 text-base font-bold text-foreground transition-colors hover:text-primary">
            {title}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <RatingStars rating={product.rating || 4.9} reviewCount={product.reviewCount || 48} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
          <div className="flex flex-col">
            <PriceTag price={product.price} originalPrice={product.originalPrice} size="sm" />
            <span className="text-[10px] text-muted-foreground font-medium">
              ≈ ៛{khrPrice} KHR
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground"
            onClick={() => addItem(product)}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
