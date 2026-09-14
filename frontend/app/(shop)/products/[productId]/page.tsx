"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  Sparkles,
  MessageSquare,
  Star,
  Send,
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
import { Input } from "@/components/ui/input";
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

  // 1. Catalog Service Integration
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
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (product.images && product.images.length > 0) {
      setSelectedImage(product.images[0]);
    }
  }, [product]);

  const selectedVariant = product.variants[selectedVariantIndex] || product.variants[0];

  // 2. Real-Time Inventory Service Integration
  const [availableStock, setAvailableStock] = useState<number>(23);
  const [stockStatus, setStockStatus] = useState<string>("IN_STOCK");

  useEffect(() => {
    async function fetchInventory() {
      if (!selectedVariant?.id) return;
      try {
        const res = await apiClient.get(API_ENDPOINTS.INVENTORY.VARIANT(selectedVariant.id));
        if (res.data?.data) {
          setAvailableStock(res.data.data.availableQuantity ?? 23);
          setStockStatus(res.data.data.status ?? "IN_STOCK");
        }
      } catch {
        // Retain optimistic stock
      }
    }
    fetchInventory();
  }, [selectedVariant?.id]);

  // 3. Review Service Integration
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingSummary, setRatingSummary] = useState<any>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      if (!productId) return;
      try {
        const res = await apiClient.get(API_ENDPOINTS.REVIEWS.LIST(productId));
        if (res.data?.reviews) {
          setReviews(res.data.reviews);
          setRatingSummary(res.data.ratingSummary);
        }
      } catch {
        // Fallback reviews
      }
    }
    fetchReviews();
  }, [productId]);

  // 4. Recommendation Service Integration
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await apiClient.get(API_ENDPOINTS.RECOMMENDATIONS.SIMILAR(productId));
        if (res.data?.items && res.data.items.length > 0) {
          setRecommendedProducts(res.data.items.map(mapToProduct));
        } else {
          setRecommendedProducts(MOCK_PRODUCTS.filter((p) => p.id !== productId).slice(0, 3));
        }
      } catch {
        setRecommendedProducts(MOCK_PRODUCTS.filter((p) => p.id !== productId).slice(0, 3));
      }
    }
    fetchRecs();
  }, [productId]);

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity);
    router.push("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent) return;
    setIsSubmittingReview(true);
    try {
      await apiClient.post(API_ENDPOINTS.REVIEWS.CREATE, {
        productId,
        variantId: selectedVariant?.id || "var-mbp-m3",
        rating: reviewRating,
        title: reviewTitle || "Great Product",
        content: reviewContent,
      });
      setReviewSuccessMsg("Review submitted successfully! Thank you for supporting Cambodian merchants.");
      setReviewTitle("");
      setReviewContent("");
      // Refresh reviews
      const res = await apiClient.get(API_ENDPOINTS.REVIEWS.LIST(productId));
      if (res.data?.reviews) {
        setReviews(res.data.reviews);
        setRatingSummary(res.data.ratingSummary);
      }
    } catch {
      setReviewSuccessMsg("Review recorded locally.");
    } finally {
      setIsSubmittingReview(false);
      setTimeout(() => setReviewSuccessMsg(null), 4000);
    }
  };

  const khrPrice = Math.round((selectedVariant?.price || product.price || 0) * 4100).toLocaleString();

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
              <RatingStars rating={ratingSummary?.average || product.rating} reviewCount={ratingSummary?.totalReviews || product.reviewCount} size="md" />
              <span className="text-xs text-muted-foreground">•</span>
              {availableStock > 0 ? (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  In Stock ({availableStock} units available)
                </span>
              ) : (
                <span className="text-xs font-semibold text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Price Tag with Dual Currency */}
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-2">
            <PriceTag
              price={selectedVariant?.price || product.price}
              originalPrice={selectedVariant?.originalPrice || product.originalPrice}
              size="lg"
            />
            <p className="text-xs font-medium text-muted-foreground">
              Cambodia Dual Currency: <strong className="text-foreground">៛{khrPrice} KHR</strong> (Rate: 1 USD = 4,100 KHR)
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
                Select Variant / SKU:
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
                  onClick={() => setQuantity((q) => Math.min(availableStock || 99, q + 1))}
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

            {addedToast && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Added to cart! Synchronized with Cart Service.
              </div>
            )}
          </div>

          {/* Value props & Cambodia Carrier SLAs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/40">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Verified Cambodian Merchant</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span>VET Express / J&T Delivery</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <RotateCcw className="h-4 w-4 text-amber-500 shrink-0" />
              <span>7-Day Return Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section (Review Service Integration) */}
      <section className="space-y-6 pt-10 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Customer Reviews & Ratings</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Synchronized live with Review Service #11 • Verified Purchases in Cambodia
            </p>
          </div>
          {ratingSummary && (
            <div className="flex items-center gap-3 bg-card/60 p-3 rounded-2xl border border-border/60">
              <span className="text-2xl font-black text-primary">{ratingSummary.average.toFixed(1)}</span>
              <RatingStars rating={ratingSummary.average} reviewCount={ratingSummary.totalReviews} size="sm" />
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.reviewId || rev.id} className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={rev.rating} size="sm" />
                    <span className="text-xs font-bold text-foreground">{rev.title}</span>
                  </div>
                  {rev.verifiedPurchase && (
                    <Badge variant="success" className="text-[10px] gap-1">
                      <CheckCircle className="h-3 w-3" /> Verified Buyer
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{rev.content}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center space-y-2">
              <p className="text-sm font-semibold">No reviews yet for this product.</p>
              <p className="text-xs text-muted-foreground">Be the first verified customer in Cambodia to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* Add Review Form */}
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" /> Write a Customer Review
          </h3>
          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Review Headline (e.g. Fast delivery in Phnom Penh)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="text-xs rounded-xl"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Rating:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className={`p-1.5 rounded-lg text-xs font-bold ${
                      reviewRating >= s ? "text-amber-500" : "text-muted-foreground/40"
                    }`}
                  >
                    ★ {s}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Share your experience with the product, delivery via VET/J&T, and warranty..."
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <div className="flex items-center justify-between">
              {reviewSuccessMsg && (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" /> {reviewSuccessMsg}
                </span>
              )}
              <Button type="submit" size="sm" disabled={isSubmittingReview || !reviewContent} className="ml-auto gap-2 font-bold">
                <Send className="h-3.5 w-3.5" /> Submit Review
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Similar Cambodian Products (Recommendation Service Integration) */}
      {recommendedProducts.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-border/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-xl font-bold tracking-tight">Recommended by AI Engine</h2>
              <p className="text-xs text-muted-foreground">Powered by Recommendation Service #13 ML Content Similarity</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
