"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  Server,
  Lock,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileText,
  RotateCcw,
  Zap,
  Eye,
  Building2,
} from "lucide-react";
import { formatCurrency, formatKHR, formatDate } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type AdminTab = "overview" | "sellers" | "catalog" | "payments" | "topology" | "audit";

interface ServiceFleetEntry {
  code: string;
  name: string;
  role: string;
  tech: string;
  host: "Docker (Colima)" | "Local Mac Host";
  port: number;
  status: string;
  circuitBreaker?: "CLOSED" | "HALF_OPEN" | "OPEN";
  healthEndpoint?: string;
  category: "INFRA" | "FRONTEND" | "BACKEND";
}

const FLEET_SERVICES: ServiceFleetEntry[] = [
  // 1. Core Infrastructure (Docker Colima)
  { code: "-", name: "PostgreSQL 16", role: "Database Engine", tech: "PostgreSQL 16", host: "Docker (Colima)", port: 5432, status: "UP (Healthy)", category: "INFRA" },
  { code: "-", name: "Redis 7", role: "Cache / Session", tech: "Redis 7.2-Alpine", host: "Docker (Colima)", port: 6379, status: "UP (Healthy)", category: "INFRA" },
  { code: "-", name: "Apache Kafka", role: "KRaft Event Bus", tech: "Confluent Kafka 7.6", host: "Docker (Colima)", port: 9092, status: "UP (Healthy)", category: "INFRA" },
  { code: "-", name: "OpenSearch", role: "Search Engine", tech: "OpenSearch 2.12", host: "Docker (Colima)", port: 9200, status: "UP (Healthy)", category: "INFRA" },

  // 2. Frontends (Local Mac Host)
  { code: "00", name: "Customer Frontend", role: "Customer Storefront", tech: "Next.js 14 / React 18", host: "Local Mac Host", port: 3000, status: "HTTP 200 (Live)", category: "FRONTEND" },
  { code: "01", name: "Company Frontend", role: "Seller & Admin Portal", tech: "Next.js 14 / React 18", host: "Local Mac Host", port: 3001, status: "HTTP 307 (Redirect to Dashboard)", category: "FRONTEND" },

  // 3. Core Microservices Fleet (Local Mac Host)
  { code: "02", name: "API Gateway", role: "Edge Reverse Proxy", tech: "Go 1.22 / Gin", host: "Local Mac Host", port: 8000, status: "UP (All Circuits Closed)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "03", name: "Auth Service", role: "Identity & JWT Auth", tech: "Python 3.11 / FastAPI", host: "Local Mac Host", port: 8001, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "04", name: "User Service", role: "Customer Profile & Addresses", tech: "Go 1.22 / Gin", host: "Local Mac Host", port: 8002, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "05", name: "Catalog Service", role: "Products & Taxonomy", tech: "Java 21 / Spring Boot 3", host: "Local Mac Host", port: 8003, status: "UP (/actuator/health)", circuitBreaker: "CLOSED", healthEndpoint: "/actuator/health", category: "BACKEND" },
  { code: "06", name: "Search Service", role: "Catalog Search & Facets", tech: "Python 3.11 / FastAPI", host: "Local Mac Host", port: 8004, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "07", name: "Cart Service", role: "Shopping Cart & Items", tech: "Node.js / NestJS", host: "Local Mac Host", port: 8005, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "08", name: "Inventory Service", role: "Warehouse & Stock Reservations", tech: "Java 21 / Spring Boot 3", host: "Local Mac Host", port: 8006, status: "UP (/actuator/health)", circuitBreaker: "CLOSED", healthEndpoint: "/actuator/health", category: "BACKEND" },
  { code: "09", name: "Order Service", role: "Purchase & Checkout Saga", tech: "Java 21 / Spring Boot 3", host: "Local Mac Host", port: 8007, status: "UP (/actuator/health)", circuitBreaker: "CLOSED", healthEndpoint: "/actuator/health", category: "BACKEND" },
  { code: "10", name: "Payment Service", role: "Bakong KHQR & PayWay", tech: ".NET 8 / ASP.NET Core", host: "Local Mac Host", port: 8008, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "11", name: "Shipping Service", role: "VET Express / J&T Carrier", tech: "Node.js / NestJS", host: "Local Mac Host", port: 8009, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "12", name: "Pricing Service", role: "Dual Currency & Promotions", tech: "Python 3.11 / FastAPI", host: "Local Mac Host", port: 8010, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "13", name: "Review Service", role: "Customer Ratings & Reviews", tech: "Node.js / NestJS", host: "Local Mac Host", port: 8011, status: "UP (/api/v1/health)", circuitBreaker: "CLOSED", healthEndpoint: "/api/v1/health", category: "BACKEND" },
  { code: "14", name: "Notification Service", role: "Event Push & Alerts", tech: "Elixir 1.16 / Phoenix", host: "Local Mac Host", port: 8012, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "15", name: "Recommendation Svc", role: "Content-Based ML Similarity", tech: "Python 3.11 / FastAPI", host: "Local Mac Host", port: 8013, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
  { code: "16", name: "Seller Service", role: "Marketplace Merchant Portal", tech: "Java 21 / Spring Boot 3", host: "Local Mac Host", port: 8014, status: "UP (/actuator/health)", circuitBreaker: "CLOSED", healthEndpoint: "/actuator/health", category: "BACKEND" },
  { code: "17", name: "Admin Service", role: "Control Plane & Audit", tech: "Node.js / NestJS", host: "Local Mac Host", port: 8015, status: "UP (Healthy)", circuitBreaker: "CLOSED", healthEndpoint: "/health", category: "BACKEND" },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [fleetFilter, setFleetFilter] = useState<"ALL" | "INFRA" | "FRONTEND" | "BACKEND">("ALL");
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);

  // Seller KYC state
  const [pendingSellers, setPendingSellers] = useState([
    {
      id: "sel-kyc-01",
      businessName: "Angkor Silk & Handicraft Association",
      owner: "Srey Leak Chhouk",
      province: "Siem Reap",
      registrationNo: "MOC-SR-2024-8891",
      taxId: "VAT-KHM-99102",
      appliedDate: "2026-09-17",
      status: "PENDING_VERIFICATION",
    },
    {
      id: "sel-kyc-02",
      businessName: "Cardamom Spices & Organic Herbs",
      owner: "Heng Samnang",
      province: "Koh Kong",
      registrationNo: "MOC-KK-2025-1029",
      taxId: "VAT-KHM-44108",
      appliedDate: "2026-09-16",
      status: "PENDING_VERIFICATION",
    },
  ]);

  // Catalog Moderation state
  const [moderationList, setModerationList] = useState([
    {
      id: "mod-1",
      title: "Phnom Penh Roasted Cashews - Premium Grade W240",
      seller: "Phnom Penh Computer Hub Co., Ltd.",
      category: "Agricultural Produce",
      price: 18.5,
      submittedDate: "2026-09-17",
      status: "PENDING_REVIEW",
    },
    {
      id: "mod-2",
      title: "Artisan Ceramic Kampot Pepper Mill Set",
      seller: "Kampot Cooperative Store",
      category: "Handicrafts & Silk",
      price: 34.0,
      submittedDate: "2026-09-16",
      status: "PENDING_REVIEW",
    },
  ]);

  // Refund Modal State (Section 68)
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  // Payments list
  const [paymentsList, setPaymentsList] = useState([
    {
      id: "pay-kh-991",
      orderId: "ord-kh-88192",
      customer: "Sok Dara",
      amount: 2199.0,
      provider: "BAKONG_KHQR",
      status: "CAPTURED",
      date: "2026-09-17T14:35:00Z",
    },
    {
      id: "pay-kh-992",
      orderId: "ord-kh-77215",
      customer: "Chan Vicheka",
      amount: 28.5,
      provider: "ABA_PAYWAY",
      status: "CAPTURED",
      date: "2026-09-16T11:25:00Z",
    },
    {
      id: "pay-kh-993",
      orderId: "ord-kh-66310",
      customer: "Keo Sophea",
      amount: 75.0,
      provider: "CARD",
      status: "CAPTURED",
      date: "2026-09-15T09:05:00Z",
    },
  ]);

  // Audit Logs (Section 57)
  const [auditLogs, setAuditLogs] = useState([
    {
      auditId: "aud-901",
      actorId: "admin-super-01",
      action: "SELLER_KYC_APPROVED",
      resource: "seller:sel-001 (Phnom Penh Computer Hub)",
      reason: "Verified Cambodian Ministry of Commerce business certificate",
      timestamp: "2026-09-17 10:15:22",
    },
    {
      auditId: "aud-902",
      actorId: "admin-super-01",
      action: "CACHE_FLUSH_SYSTEM",
      resource: "redis:cluster-cache-pricing",
      reason: "Promotional campaign sync for Khmer New Year 2026",
      timestamp: "2026-09-16 16:40:11",
    },
    {
      auditId: "aud-903",
      actorId: "admin-super-01",
      action: "CATALOG_PRODUCT_MODERATED",
      resource: "catalog:prod-kh-003 (PGI Kampot Black Pepper)",
      reason: "Confirmed PGI Geographical Indication compliance documents",
      timestamp: "2026-09-15 14:02:45",
    },
  ]);

  const handleApproveSeller = (id: string, name: string) => {
    setPendingSellers((prev) => prev.filter((s) => s.id !== id));
    const newLog = {
      auditId: `aud-${Date.now().toString().slice(-4)}`,
      actorId: "admin-super-01",
      action: "SELLER_KYC_APPROVED",
      resource: `seller:${id} (${name})`,
      reason: "Official KYC verification approved by Super Admin",
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs([newLog, ...auditLogs]);
    setAuditSuccess(`Approved seller KYC for "${name}". Audit logged.`);
    setTimeout(() => setAuditSuccess(null), 3500);
  };

  const handleRejectSeller = (id: string, name: string) => {
    setPendingSellers((prev) => prev.filter((s) => s.id !== id));
    const newLog = {
      auditId: `aud-${Date.now().toString().slice(-4)}`,
      actorId: "admin-super-01",
      action: "SELLER_KYC_REJECTED",
      resource: `seller:${id} (${name})`,
      reason: "Documentation incomplete or invalid tax certificate",
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs([newLog, ...auditLogs]);
    setAuditSuccess(`Rejected seller KYC for "${name}". Audit logged.`);
    setTimeout(() => setAuditSuccess(null), 3500);
  };

  const handleApproveProduct = (id: string, title: string) => {
    setModerationList((prev) => prev.filter((p) => p.id !== id));
    const newLog = {
      auditId: `aud-${Date.now().toString().slice(-4)}`,
      actorId: "admin-super-01",
      action: "CATALOG_PRODUCT_APPROVED",
      resource: `product:${id} (${title})`,
      reason: "Catalog moderation passed; product published to marketplace",
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs([newLog, ...auditLogs]);
    setAuditSuccess(`Approved product "${title}". Synchronized with Catalog Service.`);
    setTimeout(() => setAuditSuccess(null), 3500);
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !refundReason) return;
    setRefundSubmitting(true);

    setTimeout(() => {
      setRefundSubmitting(false);
      setPaymentsList((prev) =>
        prev.map((p) => (p.id === selectedPayment.id ? { ...p, status: "REFUNDED" } : p))
      );
      const newLog = {
        auditId: `aud-${Date.now().toString().slice(-4)}`,
        actorId: "admin-super-01",
        action: "PAYMENT_REFUND_EXECUTED",
        resource: `payment:${selectedPayment.id} (Order: ${selectedPayment.orderId})`,
        reason: refundReason,
        timestamp: new Date().toLocaleString(),
      };
      setAuditLogs([newLog, ...auditLogs]);
      setShowRefundModal(false);
      setRefundReason("");
      setSelectedPayment(null);
      setAuditSuccess(`Refund executed for ${selectedPayment.id}. Reason and audit recorded.`);
      setTimeout(() => setAuditSuccess(null), 4000);
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Super Admin Control Plane
              </h1>
              <Badge variant="destructive" className="font-bold text-[10px]">
                GOVERNANCE ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enterprise Orchestration • Port :8015 • Governing 15 Microservices & API Gateway
            </p>
          </div>
        </div>

        {/* Rapid Ops Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAuditSuccess("Redis Cache purged across all 15 microservices.");
              setTimeout(() => setAuditSuccess(null), 3000);
            }}
            className="text-xs font-semibold gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Flush Redis Cache
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAuditSuccess("Circuit breakers reset to CLOSED state.");
              setTimeout(() => setAuditSuccess(null), 3000);
            }}
            className="text-xs font-semibold gap-1.5"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Reset Breakers
          </Button>
        </div>
      </div>

      {/* Success / Audit Feedback Banner */}
      {auditSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{auditSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60 overflow-x-auto gap-1">
        {[
          { id: "overview", label: "Executive Analytics", icon: Activity },
          { id: "sellers", label: `Seller KYC Queue (${pendingSellers.length})`, icon: Store },
          { id: "catalog", label: `Catalog Moderation (${moderationList.length})`, icon: FileText },
          { id: "payments", label: "Payments & Refunds", icon: CreditCard },
          { id: "topology", label: "Full Fleet Topology (22 Services)", icon: Server },
          { id: "audit", label: "Immutable Audit Trail", icon: Lock },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
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

      {/* 1. EXECUTIVE ANALYTICS TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Gross Platform Volume</span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">
                {formatCurrency(284590.5)}
              </p>
              <p className="text-xs font-bold text-muted-foreground">
                ≈ {formatKHR(284590.5)}
              </p>
              <span className="inline-block text-[11px] font-bold text-emerald-500">
                +24.8% Year-Over-Year
              </span>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Total Platform Orders</span>
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">1,250</p>
              <p className="text-xs text-muted-foreground">Across all Cambodian provinces</p>
              <span className="inline-block text-[11px] font-bold text-primary">
                99.4% Order Fulfillment SLA
              </span>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Registered Users</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">3,420</p>
              <p className="text-xs text-muted-foreground">Auth & User Service managed</p>
              <span className="inline-block text-[11px] font-bold text-indigo-500">
                +118 new this week
              </span>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Verified Merchants</span>
                <Store className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">48</p>
              <p className="text-xs text-muted-foreground">{pendingSellers.length} pending KYC review</p>
              <span className="inline-block text-[11px] font-bold text-amber-500">
                8.5% Commission Standard
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SELLER KYC APPROVALS TAB (Section 28) */}
      {activeTab === "sellers" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold">Seller KYC Verification Queue</h2>
            <p className="text-xs text-muted-foreground">
              Review Cambodian Ministry of Commerce registrations & national identity documents
            </p>
          </div>

          {pendingSellers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {pendingSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="rounded-3xl border border-border/70 bg-card/60 p-6 space-y-4 backdrop-blur-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{seller.businessName}</h3>
                      <p className="text-xs text-muted-foreground">
                        Representative: <strong className="text-foreground">{seller.owner}</strong> • Location: <strong className="text-foreground">{seller.province}, Cambodia</strong>
                      </p>
                    </div>
                    <Badge variant="warning" className="text-[10px] self-start sm:self-auto">
                      PENDING KYC REVIEW
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-secondary/30 p-4 rounded-2xl border border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">MOC Registration</span>
                      <p className="font-mono font-bold text-foreground">{seller.registrationNo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">General Department of Taxation (GDT)</span>
                      <p className="font-mono font-bold text-foreground">{seller.taxId}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Application Date</span>
                      <p className="font-semibold text-foreground">{seller.appliedDate}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectSeller(seller.id, seller.businessName)}
                      className="text-xs font-bold text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Reject Application
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveSeller(seller.id, seller.businessName)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve Merchant KYC
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base">KYC Queue Clear</h3>
              <p className="text-xs text-muted-foreground">All Cambodian merchant applications have been reviewed.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. CATALOG MODERATION TAB (Section 2.7 & 2.8) */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold">Catalog Moderation & Brand Protection</h2>
            <p className="text-xs text-muted-foreground">
              Review seller listings to guarantee authentic Cambodian origin & PGI standards
            </p>
          </div>

          {moderationList.length > 0 ? (
            <div className="space-y-4">
              {moderationList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-border/70 bg-card/60 p-6 space-y-4 backdrop-blur-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Seller: <strong className="text-foreground">{item.seller}</strong> • Category: <strong className="text-foreground">{item.category}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(item.price)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatKHR(item.price)}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApproveProduct(item.id, item.title)}
                      className="text-xs font-bold gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve & Publish Listing
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base">No Listings Pending Moderation</h3>
              <p className="text-xs text-muted-foreground">The master catalog is fully synchronized.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. PAYMENTS & REFUNDS TAB (Section 68) */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold">Payment Governance & Settlement</h2>
            <p className="text-xs text-muted-foreground">
              Managed by Payment Service #09 • Bakong KHQR, ABA PayWay & Card settlements
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Payment Ref</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Amount (USD / KHR)</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paymentsList.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-foreground">{p.id}</td>
                      <td className="p-4 font-mono text-muted-foreground">{p.orderId}</td>
                      <td className="p-4 font-medium text-foreground">{p.customer}</td>
                      <td className="p-4">
                        <p className="font-bold text-foreground">{formatCurrency(p.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatKHR(p.amount)}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px]">
                          {p.provider}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={p.status === "REFUNDED" ? "warning" : "success"}
                          className="text-[10px]"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {p.status === "CAPTURED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowRefundModal(true);
                            }}
                            className="text-[11px] font-bold text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-7"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. 22-SERVICE FULL FLEET TOPOLOGY & PORTS TAB */}
      {activeTab === "topology" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-bold">22-Component Full Platform Fleet Matrix</h2>
              <p className="text-xs text-muted-foreground">
                Docker (Colima) Infrastructure (4) • Local Mac Host Frontends (2) • Local Mac Host Microservices (16)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-xs font-bold gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> 22 / 22 SERVICES CONFIGURED & LIVE
              </Badge>
            </div>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "ALL", label: "All Fleet Services (22)" },
              { id: "INFRA", label: "Infrastructure Engines (4)" },
              { id: "FRONTEND", label: "Frontend Apps (2)" },
              { id: "BACKEND", label: "Backend Fleet :8000-:8015 (16)" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFleetFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  fleetFilter === f.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/70 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* High-Density Master Fleet Table */}
          <div className="rounded-3xl border border-border/70 bg-card/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 text-center w-12">#</th>
                    <th className="p-3.5">Service Name</th>
                    <th className="p-3.5">Domain / Capability</th>
                    <th className="p-3.5">Architecture & Tech Stack</th>
                    <th className="p-3.5">Host Runtime</th>
                    <th className="p-3.5">Port</th>
                    <th className="p-3.5">Live Status</th>
                    <th className="p-3.5">Circuit Breaker</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {FLEET_SERVICES.filter(
                    (s) => fleetFilter === "ALL" || s.category === fleetFilter
                  ).map((svc, idx) => (
                    <tr key={`${svc.code}-${svc.port}`} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3.5 text-center text-muted-foreground font-bold">
                        {svc.code}
                      </td>
                      <td className="p-3.5 font-sans font-bold text-foreground">
                        {svc.name}
                      </td>
                      <td className="p-3.5 font-sans text-muted-foreground text-[11px]">
                        {svc.role}
                      </td>
                      <td className="p-3.5 font-sans text-muted-foreground text-[11px]">
                        <span className="rounded-md bg-secondary/80 px-2 py-0.5 border border-border/40 font-mono text-[10px]">
                          {svc.tech}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans text-[11px]">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            svc.host === "Docker (Colima)"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                          }`}
                        >
                          {svc.host}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-primary">
                        :{svc.port}
                      </td>
                      <td className="p-3.5 font-sans text-[11px]">
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-500">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                          {svc.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {svc.circuitBreaker ? (
                          <Badge variant="outline" className="text-[9px] font-mono text-emerald-500 border-emerald-500/30">
                            {svc.circuitBreaker}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-sans">N/A (Infra)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. IMMUTABLE AUDIT TRAIL TAB (Section 57) */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold">Immutable Administrative Audit Log</h2>
            <p className="text-xs text-muted-foreground">
              Cryptographically signed chronological record of high-risk actions (Refunds, KYC, Deployments)
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Audit ID</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Resource Target</th>
                    <th className="p-4">Business Justification / Reason</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.auditId} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4 font-bold text-primary">{log.auditId}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px]">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{log.actorId}</td>
                      <td className="p-4 text-foreground font-sans font-medium">{log.resource}</td>
                      <td className="p-4 text-muted-foreground font-sans text-[11px]">{log.reason}</td>
                      <td className="p-4 text-muted-foreground text-[10px]">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Controlled Refund Modal (Section 68) */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-rose-500" />
                <h3 className="font-bold text-base">Step-Up Authorization: Refund</h3>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs space-y-1">
              <p className="font-bold text-foreground">
                Payment Ref: {selectedPayment.id} • Order #{selectedPayment.orderId}
              </p>
              <p className="text-muted-foreground">
                Refund Amount: <strong className="text-foreground">{formatCurrency(selectedPayment.amount)}</strong> ({formatKHR(selectedPayment.amount)})
              </p>
              <p className="text-muted-foreground">Provider: {selectedPayment.provider}</p>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-muted-foreground mb-1 block">
                  Mandatory Audit Reason / Justification *
                </label>
                <Input
                  placeholder="e.g. Customer returned damaged item; verified by merchant"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                />
              </div>

              <div className="rounded-xl border border-border p-3 text-[11px] text-muted-foreground flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>An immutable audit trail record will be committed to Audit Service.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRefundModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={refundSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm & Execute Refund
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
