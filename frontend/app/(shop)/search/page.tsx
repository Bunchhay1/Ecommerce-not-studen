"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/product/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { MOCK_PRODUCTS } from "@/lib/api/mockData";
import { mapToProduct } from "@/lib/api/productMapper";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") || "";

  const [query, setQuery] = useState<string>(initialQ);
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [results, setResults] = useState<Product[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function executeSearch() {
      if (!query.trim()) {
        setResults(MOCK_PRODUCTS);
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
          // Local fallback filter if OpenSearch has no matches
          const q = query.trim().toLowerCase();
          const localFiltered = MOCK_PRODUCTS.filter((p) => {
            return (
              p.title.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              p.brand.toLowerCase().includes(q)
            );
          });
          setResults(localFiltered);
        }
      } catch (err) {
        console.warn("Search gateway query failed, using local filter:", err);
        const q = query.trim().toLowerCase();
        const localFiltered = MOCK_PRODUCTS.filter((p) => {
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
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const displayedResults = useMemo(() => {
    return results.filter((p) => p.price <= maxPrice);
  }, [results, maxPrice]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl font-black tracking-tight">Cambodia Marketplace Search</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search MacBook, iPhone, Jasmine Rice, Kampot Pepper, Coffee, Silk..."
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

      {/* Filter and Count Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <span className="text-xs font-semibold text-muted-foreground">
          Found <strong className="text-foreground">{displayedResults.length}</strong> matching products
        </span>

        {/* Max price slider */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Max Price: <strong className="text-primary">${maxPrice}</strong></span>
          <input
            type="range"
            min="5"
            max="3000"
            step="20"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-32 accent-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Searching OpenSearch index...</span>
        </div>
      ) : displayedResults.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">No results for &ldquo;{query}&rdquo;</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try checking spelling or try searching for &ldquo;MacBook&rdquo;, &ldquo;Rice&rdquo;, &ldquo;Pepper&rdquo;, &ldquo;Coffee&rdquo;, or &ldquo;Silk&rdquo;.
          </p>
          <Button size="sm" variant="outline" onClick={() => { setQuery(""); setMaxPrice(3000); }}>
            Reset Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedResults.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
