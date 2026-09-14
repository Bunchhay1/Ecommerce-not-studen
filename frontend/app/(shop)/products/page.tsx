"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, SlidersHorizontal, RotateCcw, Loader2 } from "lucide-react";
import { Product, Category } from "@/types/product";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/api/mockData";
import { mapToProduct } from "@/lib/api/productMapper";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || "All";

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "rating">("featured");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const prodRes = await apiClient.get(API_ENDPOINTS.CATALOG.PRODUCTS);
        const rawProducts =
          prodRes.data?.data?.content ||
          prodRes.data?.data?.items ||
          (Array.isArray(prodRes.data?.data) ? prodRes.data.data : null);

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          const mapped = rawProducts.map((p: any) => mapToProduct(p));
          setProducts(mapped);
        }
      } catch (err) {
        console.warn("Using fallback products:", err);
      } finally {
        setLoading(false);
      }

      try {
        const catRes = await apiClient.get(API_ENDPOINTS.CATALOG.CATEGORIES);
        const rawCategories = Array.isArray(catRes.data?.data) ? catRes.data.data : null;
        if (Array.isArray(rawCategories) && rawCategories.length > 0) {
          const mappedCats: Category[] = rawCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug || c.id,
            description: c.description,
            productCount: 10,
          }));
          setCategories(mappedCats);
        }
      } catch (err) {
        console.warn("Using fallback categories:", err);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "All") {
        const pCat = (typeof p.category === "object" ? (p.category as any)?.name : p.category) || "";
        if (!pCat.toLowerCase().includes(selectedCategory.toLowerCase()) && p.category !== selectedCategory) {
          return false;
        }
      }
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
  }, [products, selectedCategory, sortBy, inStockOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Cambodian Marketplace Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Displaying {filteredProducts.length} verified products across Phnom Penh, Siem Reap, and Battambang
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3">
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
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Filter by Category
              </h3>
              {selectedCategory !== "All" && (
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === "All"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                All Categories ({products.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition-all flex items-center justify-between ${
                    selectedCategory === cat.name
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className="line-clamp-1">{cat.name}</span>
                </button>
              ))}
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
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading Cambodian catalog products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-3">
              <p className="text-sm font-semibold">No products found for this category</p>
              <Button size="sm" variant="outline" onClick={() => setSelectedCategory("All")}>
                Show all products
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
