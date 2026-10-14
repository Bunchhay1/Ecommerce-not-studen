"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  CheckCircle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Warehouse,
  Truck,
  Tag,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Send,
} from "lucide-react";
import { MOCK_SELLER_PROFILE, MOCK_PRODUCTS } from "@/lib/api/mockData";
import { formatCurrency, formatKHR, formatDate } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

type SellerTab = "overview" | "listings" | "inventory" | "orders" | "promotions" | "reviews";

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState<SellerTab>("overview");
  const [seller, setSeller] = useState(MOCK_SELLER_PROFILE);
  const [listings, setListings] = useState(MOCK_PRODUCTS.slice(0, 5));
  const [isLoading, setIsLoading] = useState(false);

  // Listings Modal
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Electronics");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("25");

  // Inventory state
  const [inventoryList, setInventoryList] = useState([
    { id: "var-1", name: "MacBook Pro M3 Max - 36GB / 1TB", sku: "SKU-MBP-01", stock: 12, warehouse: "Phnom Penh Central Hub" },
    { id: "var-2", name: "Battambang Jasmine Rice (Phka Rumduol) - 10kg", sku: "SKU-RICE-10KG", stock: 85, warehouse: "Battambang Agro Logistics" },
    { id: "var-3", name: "PGI Kampot Black Pepper - 250g Ceramic", sku: "SKU-KAMPOT-BLK", stock: 4, warehouse: "Kampot Cooperative Store" },
    { id: "var-4", name: "Handwoven Siem Reap Silk Krama", sku: "SKU-SILK-001", stock: 18, warehouse: "Phnom Penh Central Hub" },
  ]);

  // Orders state
  const [ordersList, setOrdersList] = useState([
    {
      id: "ord-kh-88192",
      customer: "Sok Dara",
      city: "Phnom Penh",
      itemsCount: 2,
      total: 2199.0,
      status: "PROCESSING",
      carrier: "VET Express",
      trackingNumber: "VET-KH-9912",
      date: "2026-09-17T14:30:00Z",
    },
    {
      id: "ord-kh-77215",
      customer: "Chan Vicheka",
      city: "Siem Reap",
      itemsCount: 1,
      total: 28.5,
      status: "SHIPPED",
      carrier: "J&T Express",
      trackingNumber: "JT-SR-44120",
      date: "2026-09-16T11:20:00Z",
    },
    {
      id: "ord-kh-66310",
      customer: "Keo Sophea",
      city: "Battambang",
      itemsCount: 3,
      total: 75.0,
      status: "DELIVERED",
      carrier: "VET Express",
      trackingNumber: "VET-BTB-1082",
      date: "2026-09-15T09:00:00Z",
    },
  ]);

  // Promotions state
  const [promotionsList, setPromotionsList] = useState([
    { id: "p-1", code: "KNY2026", discount: "15% OFF", minSpend: "$50", usageCount: 142, status: "ACTIVE" },
    { id: "p-2", code: "SAVE10", discount: "$10 FLAT", minSpend: "$100", usageCount: 88, status: "ACTIVE" },
  ]);

  // Reviews state
  const [reviewsList, setReviewsList] = useState([
    {
      id: "rev-1",
      customer: "Rathana Meng",
      rating: 5,
      comment: "Super fast delivery to Toul Kork! Product was authentic and sealed properly.",
      product: "MacBook Pro M3 Max",
      date: "2026-09-16",
      reply: "Thank you for supporting our official Phnom Penh store!",
    },
    {
      id: "rev-2",
      customer: "Chenda Kim",
      rating: 5,
      comment: "The fragrant aroma of authentic Battambang Phka Rumduol rice is unmatched.",
      product: "Battambang Jasmine Rice",
      date: "2026-09-14",
      reply: null,
    },
  ]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadSellerData() {
      try {
        const profileRes = await apiClient.get(API_ENDPOINTS.SELLER.ME);
        if (profileRes.data?.data) {
          const d = profileRes.data.data;
          setSeller((prev) => ({
            ...prev,
            displayName: d.storeName || d.displayName || prev.displayName,
            totalSales: d.totalSales || prev.totalSales,
            commissionRate: d.commissionRate || prev.commissionRate,
          }));
        }
      } catch {
        // use fallback mock
      }
    }
    loadSellerData();
  }, []);

  const handleAdjustStock = (id: string, delta: number) => {
    setInventoryList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item))
    );
  };

  const handleAddListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) return;
    const priceNum = parseFloat(newPrice);
    const newEntry = {
      id: `prod-kh-${Date.now()}`,
      title: newTitle,
      price: priceNum,
      category: newCategory,
      rating: 5.0,
      reviewCount: 1,
      thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      variants: [{ id: `var-${Date.now()}`, name: "Default Variant", price: priceNum, inStock: true }],
      sellerId: seller.id,
      sellerName: seller.displayName,
      isAvailable: true,
    };
    setListings([newEntry as any, ...listings]);
    setShowAddListingModal(false);
    setNewTitle("");
    setNewPrice("");
  };

  const handleSendReply = (reviewId: string) => {
    const text = replyInputs[reviewId];
    if (!text) return;
    setReviewsList((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, reply: text } : r))
    );
    setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: string) => {
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Merchant Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {seller.displayName}
                </h1>
                <Badge variant="success" className="gap-1 font-bold text-[10px]">
                  <CheckCircle className="h-3 w-3" />
                  VERIFIED MERCHANT
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Merchant Code: <strong className="text-foreground">{seller.sellerCode}</strong> • Platform Commission: <strong className="text-primary">{seller.commissionRate}%</strong> • Currency: <strong className="text-foreground">USD & KHR (1:4,100)</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setShowAddListingModal(true)}
            className="gap-2 font-bold shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Create Marketplace Listing
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (Sections 38-42) */}
      <div className="flex border-b border-border/60 overflow-x-auto gap-1">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "listings", label: "Listings & Catalog", icon: Package },
          { id: "inventory", label: "Inventory Control", icon: Warehouse },
          { id: "orders", label: "Fulfillment & Orders", icon: ShoppingBag },
          { id: "promotions", label: "Store Vouchers", icon: Tag },
          { id: "reviews", label: "Customer Feedback", icon: MessageSquare },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SellerTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <IconComp className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Gross Marketplace Sales</span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">
                {formatCurrency(seller.totalSales)}
              </p>
              <p className="text-xs font-bold text-muted-foreground">
                ≈ {formatKHR(seller.totalSales)}
              </p>
              <span className="inline-block text-[11px] font-bold text-emerald-500">
                +18.4% vs previous month
              </span>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Active Listings</span>
                <Package className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">
                {listings.length}
              </p>
              <p className="text-xs text-muted-foreground">Across 3 verified categories</p>
              <span className="inline-block text-[11px] font-bold text-primary">
                100% Catalog Approved
              </span>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Fulfilled Orders</span>
                <ShoppingBag className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">482</p>
              <p className="text-xs text-muted-foreground">VET & J&T Express carrier</p>
              <span className="inline-block text-[11px] font-bold text-indigo-500">
                99.8% On-Time Dispatch SLA
              </span>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Merchant Rating</span>
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">{seller.rating} / 5.0</p>
              <p className="text-xs text-muted-foreground">From 184 verified reviews</p>
              <span className="inline-block text-[11px] font-bold text-amber-500">
                Top Rated Seller Cambodia
              </span>
            </div>
          </div>

          {/* Quick Alerts Banner */}
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Low Stock Warning: PGI Kampot Black Pepper (4 units remaining)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kampot Cooperative Store inventory is below reorder threshold. Allocate more stock to avoid listing auto-pause.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("inventory")}
              className="shrink-0 text-xs font-bold"
            >
              Manage Inventory
            </Button>
          </div>
        </div>
      )}

      {/* 2. LISTINGS TAB (Catalog Management) */}
      {activeTab === "listings" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold">Catalog Listings</h2>
              <p className="text-xs text-muted-foreground">
                Managed through Catalog Service #04 • Linked with Search & OpenSearch index
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddListingModal(true)}
              className="gap-1.5 font-bold"
            >
              <Plus className="h-4 w-4" /> Add Listing
            </Button>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price (USD / KHR)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {listings.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="h-10 w-10 rounded-xl object-cover border border-border/50 bg-muted"
                          />
                          <div>
                            <p className="font-bold text-foreground text-xs line-clamp-1">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground">Ref: {item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-muted-foreground">{item.category}</td>
                      <td className="p-4">
                        <p className="font-bold text-foreground">{formatCurrency(item.price)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatKHR(item.price)}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="success" className="text-[10px]">
                          ACTIVE
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/products/${item.id}`}
                          className="text-primary hover:underline font-semibold"
                        >
                          View Live ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. INVENTORY TAB (Section 39) */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold">Inventory & Warehouse Stock</h2>
              <p className="text-xs text-muted-foreground">
                Governed by Inventory Service #07 • Atomic stock adjustments and reservations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {inventoryList.map((inv) => (
              <div
                key={inv.id}
                className="rounded-2xl border border-border/70 bg-card/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{inv.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {inv.sku}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 text-primary" /> {inv.warehouse}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`text-base font-black ${
                        inv.stock <= 5 ? "text-rose-500" : "text-emerald-500"
                      }`}
                    >
                      {inv.stock} Units
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {inv.stock <= 5 ? "Low Stock Alert" : "Adequate"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjustStock(inv.id, -1)}
                      className="h-8 w-8 p-0 font-bold"
                    >
                      -
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjustStock(inv.id, 5)}
                      className="h-8 px-2.5 text-xs font-bold"
                    >
                      +5 Restock
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ORDERS & FULFILLMENT TAB (Section 40) */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Fulfillment & Orders</h2>
              <p className="text-xs text-muted-foreground">
                Synchronized with Order Service #08 & Shipping Service #10 (VET / J&T Logistics)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {ordersList.map((ord) => (
              <div
                key={ord.id}
                className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-3 backdrop-blur-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground text-sm">{ord.id}</span>
                    <Badge
                      variant={
                        ord.status === "DELIVERED"
                          ? "success"
                          : ord.status === "SHIPPED"
                          ? "default"
                          : "warning"
                      }
                      className="text-[10px]"
                    >
                      {ord.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(ord.date)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-y border-border/40 py-2.5">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Customer</span>
                    <p className="font-semibold text-foreground">{ord.customer} ({ord.city})</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Order Value</span>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(ord.total)} ({formatKHR(ord.total)})
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Carrier & Tracking</span>
                    <p className="font-semibold text-primary flex items-center gap-1">
                      <Truck className="h-3 w-3" /> {ord.carrier}: {ord.trackingNumber}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {ord.status === "PROCESSING" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(ord.id, "SHIPPED")}
                      className="text-xs font-bold gap-1.5"
                    >
                      <Truck className="h-3.5 w-3.5" /> Dispatch via VET Express
                    </Button>
                  )}
                  {ord.status === "SHIPPED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateOrderStatus(ord.id, "DELIVERED")}
                      className="text-xs font-bold gap-1.5 text-emerald-500"
                    >
                      <Check className="h-3.5 w-3.5" /> Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PROMOTIONS TAB (Section 41) */}
      {activeTab === "promotions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Store Vouchers & Campaigns</h2>
              <p className="text-xs text-muted-foreground">
                Authoritative calculations performed by Pricing & Promotion Service #11
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promotionsList.map((promo) => (
              <div
                key={promo.id}
                className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-primary/5 to-card p-6 space-y-3 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-lg font-black text-primary">{promo.code}</span>
                  <Badge variant="success" className="text-[10px]">
                    {promo.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground text-sm">{promo.discount} Store-Wide</p>
                  <p className="text-muted-foreground">Minimum order spend: {promo.minSpend}</p>
                  <p className="text-muted-foreground">Total customer redemptions: {promo.usageCount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. REVIEWS TAB (Section 42) */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold">Customer Feedback & Reviews</h2>
            <p className="text-xs text-muted-foreground">
              Powered by Review Service #12 • Only verified Cambodian buyers can review
            </p>
          </div>

          <div className="space-y-4">
            {reviewsList.map((rev) => (
              <div
                key={rev.id}
                className="rounded-3xl border border-border/70 bg-card/60 p-6 space-y-4 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{rev.customer}</span>
                      <span className="text-xs text-muted-foreground">• on {rev.product}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{rev.date}</span>
                </div>

                <p className="text-xs text-foreground/90 leading-relaxed bg-secondary/30 p-3 rounded-2xl border border-border/40">
                  &quot;{rev.comment}&quot;
                </p>

                {rev.reply ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-1 text-xs">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5" /> Merchant Official Response
                    </span>
                    <p className="text-foreground">{rev.reply}</p>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Write an official merchant reply..."
                      value={replyInputs[rev.id] || ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({ ...prev, [rev.id]: e.target.value }))
                      }
                      className="text-xs rounded-xl h-9"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSendReply(rev.id)}
                      className="gap-1.5 font-bold rounded-xl h-9 shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" /> Reply
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add New Listing */}
      {showAddListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base">List New Marketplace Product</h3>
              <button
                onClick={() => setShowAddListingModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddListing} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground mb-1 block">Product Title *</label>
                <Input
                  placeholder="e.g. Organic Battambang Jasmine Rice"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Agricultural Produce">Agricultural Produce</option>
                    <option value="Handicrafts & Silk">Handicrafts & Silk</option>
                    <option value="Spices & Pepper">Spices & Pepper</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground mb-1 block">Price (USD) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground mb-1 block">Initial Stock Quantity</label>
                <Input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddListingModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-bold">
                  Publish Listing
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
