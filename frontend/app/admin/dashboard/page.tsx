"use client";

import React, { useState } from "react";
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
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);

  const metrics = [
    { title: "Gross Marketplace Volume", value: formatCurrency(342980.50), change: "+24.2% MoM", icon: DollarSign },
    { title: "Total Platform Orders", value: "1,420", change: "99.4% Fulfillment", icon: ShoppingBag },
    { title: "Registered Customers", value: "3,890", change: "42 today", icon: Users },
    { title: "Onboarded Sellers", value: "154", change: "2 pending verification", icon: Store },
  ];

  const microservices = [
    { name: "01 Auth Service", port: 8001, status: "UP", tech: "FastAPI / Python" },
    { name: "02 User Service", port: 8002, status: "UP", tech: "Gin / Go" },
    { name: "03 Catalog Service", port: 8003, status: "UP", tech: "Spring Boot / Java" },
    { name: "04 Search Service", port: 8004, status: "UP", tech: "FastAPI / Python" },
    { name: "05 Cart Service", port: 8005, status: "UP", tech: "NestJS / Node" },
    { name: "06 Inventory Service", port: 8006, status: "UP", tech: "Spring Boot / Java" },
    { name: "07 Order Service", port: 8007, status: "UP", tech: "Spring Boot / Java" },
    { name: "08 Payment Service", port: 8008, status: "UP", tech: "ASP.NET Core / C#" },
    { name: "09 Shipping Service", port: 8009, status: "UP", tech: "NestJS / Node" },
    { name: "10 Pricing Service", port: 8010, status: "UP", tech: "FastAPI / Python" },
    { name: "11 Review Service", port: 8011, status: "UP", tech: "NestJS / Node" },
    { name: "12 Notification Service", port: 8012, status: "UP", tech: "Phoenix / Elixir" },
    { name: "13 Recommendation Service", port: 8013, status: "UP", tech: "FastAPI / Python" },
    { name: "14 Seller Service", port: 8014, status: "UP", tech: "Spring Boot / Java" },
    { name: "15 Admin Service", port: 8015, status: "UP", tech: "NestJS / Node" },
    { name: "16 API Gateway", port: 8000, status: "UP", tech: "Gin / Go Ingress" },
  ];

  const handleSimulateAction = (actionName: string) => {
    setAuditSuccess(`Audit entry created: [${actionName}] logged with append-only hash to admin_db`);
    setTimeout(() => setAuditSuccess(null), 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Admin Control Plane</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Connected via Admin Service #15 (:8015) • Immutable Audit Logging Active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" className="gap-1 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            All 16 Services Operational
          </Badge>
        </div>
      </div>

      {auditSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{auditSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">{m.title}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <m.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">{m.value}</div>
            <div className="text-[11px] font-medium text-emerald-500">{m.change}</div>
          </div>
        ))}
      </div>

      {/* Operational Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Pending Operational Actions
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div>
                <strong className="text-foreground">Seller Verification Pending</strong>
                <p className="text-muted-foreground mt-0.5">SoundLab Audio submitted tax documentation for review</p>
              </div>
              <Button size="sm" onClick={() => handleSimulateAction("SELLER_VERIFIED")} className="h-8 text-xs font-bold">
                Approve Seller
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <div>
                <strong className="text-foreground">Customer Chargeback Dispute</strong>
                <p className="text-muted-foreground mt-0.5">ORD-2026-9812 requested refund investigation ($50.00)</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => handleSimulateAction("ORDER_REFUNDED")} className="h-8 text-xs font-bold">
                Process Refund
              </Button>
            </div>
          </div>
        </div>

        {/* Rapid Control Overrides */}
        <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Security & Overrides
          </h2>
          <div className="space-y-2 text-xs">
            <button
              onClick={() => handleSimulateAction("CACHE_EVICTED")}
              className="w-full text-left rounded-xl border border-border p-3 hover:bg-secondary transition-colors"
            >
              <div className="font-semibold text-foreground">Flush Gateway Redis Cache</div>
              <p className="text-[11px] text-muted-foreground">Evict catalog & permission cache</p>
            </button>
            <button
              onClick={() => handleSimulateAction("CIRCUIT_BREAKER_RESET")}
              className="w-full text-left rounded-xl border border-border p-3 hover:bg-secondary transition-colors"
            >
              <div className="font-semibold text-foreground">Reset All Circuit Breakers</div>
              <p className="text-[11px] text-muted-foreground">Force all 16 breakers to CLOSED</p>
            </button>
          </div>
        </div>
      </div>

      {/* Microservices Topology Grid */}
      <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          Distributed Microservices Fleet Topology
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {microservices.map((svc) => (
            <div key={svc.name} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground line-clamp-1">{svc.name}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-muted-foreground">Port :{svc.port}</p>
              <p className="text-[10px] font-medium text-primary">{svc.tech}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
