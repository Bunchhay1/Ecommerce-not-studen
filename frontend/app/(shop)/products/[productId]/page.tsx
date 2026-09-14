"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
import { Product } from "@/types/product";
import { MOCK_PRODUCTS } from "@/lib/api/mockData";
import { mapToProduct } from "@/lib/api/productMapper";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ProductCard } from "@/components/product/product-card";
import { PriceTag } from "@/components/product/price-tag";
import { RatingStars } from "@/components/product/rating-stars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart.store";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.productId as string;
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product>(() => {
    return (
      MOCK_PRODUCTS.find((p) => p.id === productId || p.slug === productId) ||
      MOCK_PRODUCTS[0]
    );
  });

  useEffect(() => {
    async function fetchDetail() {
      if (!productId) return;
      try {
        const res = await apiClient.get(API_ENDPOINTS.CATALOG.PRODUCT_DETAIL(productId));
        if (res.data?.data) {
          setProduct(mapToProduct(res.data.data));
        }
      } catch (err) {
        console.warn("Using fallback product details:", err);
      }
    }
    fetchDetail();
  }, [productId]);

  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] || product.thumbnail);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product.images && product.images.length > 0) {
      setSelectedImage(product.images[0]);
    }
  }, [product]);

  const selectedVariant = product.variants[selectedVariantIndex] || product.variants[0];

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity);
    router.push("/checkout");
  };

  const similarProducts = MOCK_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);
  const khrPrice = Math.round((product.price || 0) * 4100).toLocaleString();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back button */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all products
        </Link>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border/70 bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage || product.images[0] || product.thumbnail}
              alt={product.title}
              className="h-full w-full object-cover object-center transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    selectedImage === img
                      ? "border-primary shadow-md"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="thumbnail" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specs & Purchasing */}
        <div className="flex flex-col space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-semibold">
                {product.category}
              </Badge>
              {product.sellerName && (
                <span className="text-xs text-muted-foreground">
                  Sold by <span className="font-semibold text-primary">{product.sellerName}</span>
                </span>
              )}
            </div>

            <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {product.title}
            </h1>

            <div className="mt-3 flex items-center gap-4">
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="md" />
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                In Stock ({selectedVariant?.availableStock || 50} units)
              </span>
            </div>
          </div>

          {/* Price Tag with KHR */}
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-2">
            <PriceTag
              price={selectedVariant?.price || product.price}
              originalPrice={selectedVariant?.originalPrice || product.originalPrice}
              size="lg"
            />
            <p className="text-xs font-medium text-muted-foreground">
              Dual Currency: <strong className="text-foreground">៛{khrPrice} KHR</strong> (Rate: 1 USD = 4,100 KHR)
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          {/* Variants selector */}
          {product.variants.length > 1 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Option / SKU:
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                      selectedVariantIndex === idx
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border/60 bg-card/40 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity:</span>
              <div className="flex items-center rounded-xl border border-border bg-card/60">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 gap-2 font-bold"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                className="flex-1 font-bold shadow-lg shadow-primary/20"
                onClick={handleBuyNow}
              >
                Instant Buy (Bakong KHQR)
              </Button>
            </div>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/40">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Verified Cambodian Merchant</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span>VET / J&T Nationwide</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <RotateCcw className="h-4 w-4 text-amber-500 shrink-0" />
              <span>7-Day Return Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Cambodian Products */}
      {similarProducts.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-border/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">More from Cambodian Marketplace</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
