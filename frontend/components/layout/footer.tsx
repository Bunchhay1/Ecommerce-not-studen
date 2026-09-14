import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck, Zap, Truck, Headphones } from "lucide-react";

export function Footer() {
  const valueProps = [
    { icon: Truck, title: "Next-Day Delivery", description: "Free on orders over $50" },
    { icon: ShieldCheck, title: "Enterprise Escrow", description: "100% money-back guarantee" },
    { icon: Zap, title: "Instant Checkout", description: "Tokenized multi-gateway payment" },
    { icon: Headphones, title: "24/7 Concierge Support", description: "Live resolution via ticket" },
  ];

  return (
    <footer className="border-t border-border/60 bg-card/40 backdrop-blur-sm">
      {/* Value props banner */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer directory */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
                <Compass className="h-4 w-4" />
              </div>
              <span className="font-extrabold tracking-tight text-foreground">
                NOVA<span className="text-primary">MARKET</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Resilient distributed e-commerce platform running across 16 microservices with unified Go API Gateway.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Marketplace</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">All Products</Link></li>
              <li><Link href="/search" className="hover:text-foreground">Search & Filters</Link></li>
              <li><Link href="/orders" className="hover:text-foreground">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Partners</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/seller/dashboard" className="hover:text-foreground">Seller Portal</Link></li>
              <li><Link href="/seller/products" className="hover:text-foreground">List Products</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-foreground">Admin Control Plane</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Architecture</h5>
            <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                API Gateway (:8000) Active
              </span>
              <span>16 Services Orchestrated</span>
              <span>Next.js App Router Client</span>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© 2026 NovaMarket Microservices Ecosystem. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Security Compliant</span>
            <span>PCI-DSS Tokenized</span>
            <span>Apache Kafka Event-Driven</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
