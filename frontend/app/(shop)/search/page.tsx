"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2, Sparkles } from "lucide-react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/product/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mapToProduct } from "@/lib/api/productMapper";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") || "";

  const [query, setQuery] = useState<string>(initialQ);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [prodRes, priceRes] = await Promise.allSettled([
          apiClient.get(`${API_ENDPOINTS.CATALOG.PRODUCTS}?page=0&size=500`),
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

        if (prodRes.status === "fulfilled") {
          const rawProducts =
            prodRes.value.data?.data?.content ||
            prodRes.value.data?.data?.items ||
            (Array.isArray(prodRes.value.data?.data) ? prodRes.value.data.data : null);

          if (Array.isArray(rawProducts) && rawProducts.length > 0) {
            const mapped = rawProducts.map((p: any) => mapToProduct(p, priceMap));
            setAllProducts(mapped);
            if (!query.trim()) {
              setResults(mapped);
            }
          }
        }
      } catch (err) {
        console.warn("Could not preload catalog for search:", err);
      }
    }

    loadCatalog();
  }, []);

  useEffect(() => {
    async function executeSearch() {
      if (!query.trim()) {
        setResults(allProducts);
        return;
      }

      setLoading(true);
      try {
        const res = await apiClient.get(API_ENDPOINTS.SEARCH.QUERY, {
          params: { q: query.trim() },
        });

        const rawItems =
          res.data?.data?.items ||
          res.data?.data?.content ||
          (Array.isArray(res.data?.data) ? res.data.data : null);

        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const mapped = rawItems.map((item: any) => mapToProduct(item));
          setResults(mapped);
        } else {
          // Local catalog filter
          const q = query.trim().toLowerCase();
          const localFiltered = allProducts.filter((p) => {
            return (
              p.title.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              p.brand.toLowerCase().includes(q)
            );
          });
          setResults(localFiltered);
        }
      } catch {
        const q = query.trim().toLowerCase();
        const localFiltered = allProducts.filter((p) => {
          return (
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q)
          );
        });
        setResults(localFiltered);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      executeSearch();
    }, 200);

    return () => clearTimeout(timer);
  }, [query, allProducts]);

  const displayedResults = useMemo(() => {
    return results.filter((p) => p.price <= maxPrice);
  }, [results, maxPrice]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          <span>Instant Full-Text Search</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Marketplace Search</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Apple, Sony, Dell, Nike, Casio, Herman Miller, Dyson..."
            className="pl-11 pr-10 h-12 text-base rounded-2xl border-border/80 shadow-md bg-card/80 backdrop-blur-md"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4 backdrop-blur-sm sticky top-24">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter by Price
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Max Price</span>
                <span className="text-primary font-bold">${maxPrice}</span>
              </div>
              <input
                type="range"
                min="10"
                max="5000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>$10</span>
                <span>$5,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Found <strong className="text-foreground">{displayedResults.length}</strong> matching products
              {query && <span> for &ldquo;<strong className="text-foreground">{query}</strong>&rdquo;</span>}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Searching catalog...</span>
            </div>
          ) : displayedResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-3">
              <p className="text-sm font-semibold">No products matched your search criteria.</p>
              <Button size="sm" variant="outline" onClick={() => { setQuery(""); setMaxPrice(5000); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-xl" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
