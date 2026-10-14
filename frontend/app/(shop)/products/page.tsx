"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, SlidersHorizontal, RotateCcw, Loader2, Sparkles, Check, Search } from "lucide-react";
import { Product, Category } from "@/types/product";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/api/mockData";
import { mapToProduct } from "@/lib/api/productMapper";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || "All";

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "rating">("featured");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
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

        let loadedCategories: Category[] = [];
        if (catRes.status === "fulfilled") {
          const rawCategories = Array.isArray(catRes.value.data?.data)
            ? catRes.value.data.data
            : Array.isArray(catRes.value.data)
            ? catRes.value.data
            : [];
          if (rawCategories.length > 0) {
            loadedCategories = rawCategories.map((c: any) => ({
              id: c.id,
              parentId: c.parentId || c.parent_id || null,
              name: c.name,
              slug: c.slug || c.id,
              description: c.description,
              productCount: c.productCount || 0,
            }));
            setCategories(loadedCategories);
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

            // Compute actual product counts per category
            if (loadedCategories.length > 0) {
              const countMap: Record<string, number> = {};
              mapped.forEach((p) => {
                if (p.categoryId) countMap[p.categoryId] = (countMap[p.categoryId] || 0) + 1;
                if (p.categoryParentId) countMap[p.categoryParentId] = (countMap[p.categoryParentId] || 0) + 1;
              });
              setCategories(
                loadedCategories.map((c) => ({
                  ...c,
                  productCount: countMap[c.id] || 0,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.warn("Using fallback data for products page:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesCat) return false;
      }

      // 2. Category Filter
      if (selectedCategory && selectedCategory !== "All") {
        const sel = selectedCategory.toLowerCase().trim();
        const matchedCat = categories.find(
          (c) =>
            c.name.toLowerCase() === sel ||
            c.slug.toLowerCase() === sel ||
            c.id.toLowerCase() === sel
        );

        if (matchedCat) {
          // If category is a parent, match children
          const isMatch =
            p.categoryId === matchedCat.id ||
            p.categoryParentId === matchedCat.id ||
            p.categorySlug === matchedCat.slug ||
            p.category.toLowerCase() === matchedCat.name.toLowerCase();
          if (!isMatch) return false;
        } else {
          // Fallback string matching
          const pCat = p.category.toLowerCase();
          const pCatSlug = (p.categorySlug || "").toLowerCase();
          if (!pCat.includes(sel) && !sel.includes(pCat) && !pCatSlug.includes(sel)) {
            return false;
          }
        }
      }

      // 3. In Stock Filter
      if (inStockOnly && !p.inStock) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [products, selectedCategory, searchQuery, sortBy, inStockOnly, categories]);

  // Group categories into parent/subcategories for cleaner sidebar display
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const subCategories = useMemo(() => {
    return categories.filter((c) => Boolean(c.parentId));
  }, [categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-2">
            <Sparkles className="h-3 w-3" />
            <span>400 Authentic Global Brand Products</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Global Marketplace Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Displaying {filteredProducts.length} verified authentic products with manufacturer warranties, dual USD/KHR pricing, and fast nationwide delivery.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-card/60"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="featured" className="bg-card">Featured</option>
              <option value="price_asc" className="bg-card">Price: Low to High</option>
              <option value="price_desc" className="bg-card">Price: High to Low</option>
              <option value="rating" className="bg-card">Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Categories
              </h3>
              {selectedCategory !== "All" && (
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            {/* All Products button */}
            <button
              onClick={() => setSelectedCategory("All")}
              className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold transition-all flex items-center justify-between ${
                selectedCategory === "All"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span>All Categories</span>
              <span className="text-[11px] opacity-80">{products.length}</span>
            </button>

            {/* Subcategory List with Product Counts */}
            <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
              {subCategories.length > 0 ? (
                subCategories.map((cat) => {
                  const isSelected =
                    selectedCategory === cat.name ||
                    selectedCategory === cat.slug ||
                    selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm font-bold"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="line-clamp-1">{cat.name}</span>
                      {cat.productCount !== undefined && cat.productCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {cat.productCount}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                categories.map((cat) => {
                  const isSelected =
                    selectedCategory === cat.name ||
                    selectedCategory === cat.slug ||
                    selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm font-bold"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="line-clamp-1">{cat.name}</span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-border/60 pt-4 space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-border accent-primary h-4 w-4"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Loading marketplace products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-3">
              <p className="text-base font-bold">No products found</p>
              <p className="text-xs text-muted-foreground">Try clearing your search query or choosing another category filter.</p>
              <Button size="sm" variant="outline" onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}>
                Show all products
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
