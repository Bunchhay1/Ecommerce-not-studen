"use client";

import React from "react";
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
} from "lucide-react";
import { MOCK_SELLER_PROFILE, MOCK_PRODUCTS, MOCK_ORDERS } from "@/lib/api/mockData";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SellerDashboardPage() {
  const seller = MOCK_SELLER_PROFILE;
  const listings = MOCK_PRODUCTS.filter((p) => p.sellerId === seller.id || true).slice(0, 3);

  const stats = [
    { title: "Gross Marketplace Sales", value: formatCurrency(seller.totalSales), change: "+18.4% vs last month", icon: DollarSign },
    { title: "Active Listings", value: "14", change: "2 pending verification", icon: Package },
    { title: "Total Orders Fulfilled", value: "482", change: "99.8% on-time dispatch", icon: ShoppingBag },
    { title: "Seller Performance Rating", value: `${seller.rating} / 5.0`, change: "Top Rated Merchant", icon: Star },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black tracking-tight">{seller.displayName}</h1>
            <Badge variant="success" className="gap-1 font-bold">
              <CheckCircle className="h-3 w-3" />
              {seller.verificationStatus}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Seller Code: <strong className="text-foreground">{seller.sellerCode}</strong> • Platform Commission Rate: <strong className="text-primary">{seller.commissionRate}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" className="gap-2 font-bold shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add New Listing
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">{s.title}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">{s.value}</div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
              <TrendingUp className="h-3 w-3" />
              <span>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Listings Table */}
      <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Active Product Listings
          </h2>
          <span className="text-xs text-muted-foreground font-medium">Syncing with Seller Service #14</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                <th className="pb-3">Product</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Stock Status</th>
                <th className="pb-3">Rating</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {listings.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 pr-4 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumbnail} alt={item.title} className="h-10 w-10 rounded-lg object-cover bg-muted" />
                    <div>
                      <p className="font-bold text-foreground line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category}</p>
                    </div>
                  </td>
                  <td className="py-3.5 font-bold text-primary">{formatCurrency(item.price)}</td>
                  <td className="py-3.5">
                    <Badge variant="success" className="text-[10px]">In Stock</Badge>
                  </td>
                  <td className="py-3.5 font-semibold">{item.rating} ★ ({item.reviewCount})</td>
                  <td className="py-3.5 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-xs">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
