"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Smartphone,
  Laptop,
  Layers,
  Cpu,
  ShoppingBag,
  Headphones,
  Camera,
  Watch,
  Coffee,
  Tv,
  Footprints,
  Shirt,
  Sparkle,
  Dumbbell,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { Product, Category } from "@/types/product";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/api/mockData";
import { mapToProduct } from "@/lib/api/productMapper";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes, priceRes] = await Promise.allSettled([
          apiClient.get(`${API_ENDPOINTS.CATALOG.PRODUCTS}?page=0&size=500`),
          apiClient.get(API_ENDPOINTS.CATALOG.CATEGORIES),
          apiClient.get(`${API_ENDPOINTS.PRICING.PRICES}?skip=0&limit=500`),
        ]);

        const priceMap: Record<string, { price: number; originalPrice: number }> = {};
        if (priceRes.status === "fulfilled") {
          const pricesData = Array.isArray(priceRes.value.data)
            ? priceRes.value.data
            : priceRes.value.data?.data;
          if (Array.isArray(pricesData)) {
            pricesData.forEach((item: any) => {
              if (item.productId) {
                const sp = parseFloat(item.salePrice || item.sale_price) || 0;
                const bp = parseFloat(item.basePrice || item.base_price) || sp;
                priceMap[item.productId] = { price: sp || bp, originalPrice: bp };
              }
            });
          }
        }

        let loadedCats: Category[] = [];
        if (catRes.status === "fulfilled") {
          const rawCategories = Array.isArray(catRes.value.data?.data)
            ? catRes.value.data.data
            : Array.isArray(catRes.value.data)
            ? catRes.value.data
            : [];
          if (rawCategories.length > 0) {
            loadedCats = rawCategories.map((c: any) => ({
              id: c.id,
              parentId: c.parentId || c.parent_id || null,
              name: c.name,
              slug: c.slug || c.id,
              description: c.description,
              productCount: c.productCount || 0,
            }));
            setCategories(loadedCats);
          }
        }

        if (prodRes.status === "fulfilled") {
          const rawProducts =
            prodRes.value.data?.data?.content ||
            prodRes.value.data?.data?.items ||
            (Array.isArray(prodRes.value.data?.data) ? prodRes.value.data.data : null);

          if (Array.isArray(rawProducts) && rawProducts.length > 0) {
            const mapped = rawProducts.map((p: any) => mapToProduct(p, priceMap));
            setProducts(mapped);

            if (loadedCats.length > 0) {
              const countMap: Record<string, number> = {};
              mapped.forEach((p) => {
                if (p.categoryId) countMap[p.categoryId] = (countMap[p.categoryId] || 0) + 1;
              });
              setCategories(
                loadedCats.map((c) => ({
                  ...c,
                  productCount: countMap[c.id] || c.productCount || 10,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch data from Gateway, using fallback:", err);
      }
    }
    loadData();
  }, []);

  // Filter subcategories for the category quick-browse grid
  const featuredCategories = useMemo(() => {
    const subs = categories.filter((c) => Boolean(c.parentId));
    return subs.length > 0 ? subs.slice(0, 12) : categories.slice(0, 12);
  }, [categories]);

  // Select spotlight featured products across diverse categories
  const spotlightProducts = useMemo(() => {
    return products.slice(0, 12);
  }, [products]);

  const getCategoryIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes("laptop") || s.includes("macbook")) return <Laptop className="h-6 w-6" />;
    if (s.includes("phone") || s.includes("tablet")) return <Smartphone className="h-6 w-6" />;
    if (s.includes("audio") || s.includes("headphone") || s.includes("speaker")) return <Headphones className="h-6 w-6" />;
    if (s.includes("camera") || s.includes("drone")) return <Camera className="h-6 w-6" />;
    if (s.includes("watch") || s.includes("timepiece") || s.includes("wearable")) return <Watch className="h-6 w-6" />;
    if (s.includes("sneaker") || s.includes("shoe") || s.includes("footwear")) return <Footprints className="h-6 w-6" />;
    if (s.includes("apparel") || s.includes("jacket") || s.includes("streetwear")) return <Shirt className="h-6 w-6" />;
    if (s.includes("coffee") || s.includes("espresso")) return <Coffee className="h-6 w-6" />;
    if (s.includes("display") || s.includes("peripheral") || s.includes("monitor")) return <Tv className="h-6 w-6" />;
    if (s.includes("fitness") || s.includes("gym") || s.includes("sports")) return <Dumbbell className="h-6 w-6" />;
    if (s.includes("skincare") || s.includes("perfume") || s.includes("beauty")) return <Sparkle className="h-6 w-6" />;
    return <Layers className="h-6 w-6" />;
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/40">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-10 right-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>BC-MARKET • 400 Verified Global Products • 16 Microservices Live</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto"
          >
            Global Brands,{" "}
            <span className="gradient-text">Engineered for Commerce.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Explore 400 verified authentic Apple, Sony, Dell, Nike, Casio, and Herman Miller products with manufacturer warranties, dual USD & KHR pricing, and Bakong KHQR checkout.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-4"
          >
            <Link href="/products">
              <Button size="lg" className="gap-2 font-bold shadow-xl shadow-primary/25">
                Explore All 400 Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/seller/dashboard">
              <Button size="lg" variant="outline" className="gap-2 font-semibold">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Merchant Portal
              </Button>
            </Link>
          </motion.div>

          {/* Quick Metrics Pills */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Bakong KHQR & ABA PayWay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>Express Nationwide Logistics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>1 USD = 4,100 KHR Dual Currency</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Browse Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Browse by Category</h2>
            <p className="text-sm text-muted-foreground mt-1">Explore curated authentic tech, footwear, luxury timepieces, and home living</p>
          </div>
          <Link href="/products" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View all categories <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm text-center transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                {getCategoryIcon(cat.slug)}
              </div>
              <span className="mt-3 text-xs font-bold text-foreground line-clamp-1">{cat.name}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {cat.productCount ? `${cat.productCount} Products` : "Explore"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Spotlight Releases</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
          </div>
          <Link href="/products" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            See all 400 products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {spotlightProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/products">
            <Button size="lg" variant="outline" className="font-bold gap-2 px-8">
              Explore Entire Catalog ({products.length} Items)
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 4. Promotion Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card/80 via-primary/5 to-card/80 p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-bold text-primary">
              Grand Global Launch 2026
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Instant 15% OFF Across All Brand Stores
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use promotional coupon code <strong className="text-primary font-bold">GLOBAL2026</strong> at checkout to claim instant 15% discounts on laptops, flagship phones, noise-canceling headphones, and designer sneakers.
            </p>
            <div className="pt-2">
              <Link href="/products">
                <Button className="font-bold gap-2">
                  Shop Deals Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
