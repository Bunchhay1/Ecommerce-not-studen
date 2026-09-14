"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Search,
  User,
  Sun,
  Moon,
  Store,
  ShieldAlert,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toggleCart, getItemCount } = useCartStore();
  const { user, activeRole, switchRole, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const itemCount = getItemCount();

  const navLinks = [
    { label: "Products", href: "/products" },
    { label: "Search", href: "/search" },
    { label: "Orders", href: "/orders" },
  ];

  return (
    <header className="glass-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-foreground">
                NOVA<span className="text-primary">MARKET</span>
              </span>
              <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                Enterprise
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Controls & Portal Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-Role Portal Switcher */}
          <div className="hidden lg:flex items-center rounded-xl border border-border/60 bg-muted/30 p-1 text-xs font-semibold">
            <button
              onClick={() => switchRole("CUSTOMER")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                activeRole === "CUSTOMER"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Shop
            </button>
            <Link
              href="/seller/dashboard"
              onClick={() => switchRole("SELLER")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                activeRole === "SELLER"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="h-3 w-3" />
              Seller
            </Link>
            <Link
              href="/admin/dashboard"
              onClick={() => switchRole("ADMIN")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                activeRole === "ADMIN"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              Admin
            </Link>
          </div>

          {/* Quick Search */}
          <Link href="/search">
            <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground">
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          {/* Theme Toggle */}
          <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Cart Trigger */}
          <Button
            size="icon"
            variant="ghost"
            className="relative h-9 w-9 text-muted-foreground"
            onClick={toggleCart}
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <Badge
                variant="default"
                className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full p-0.5 text-[10px] font-black shadow-md shadow-primary/30"
              >
                {itemCount}
              </Badge>
            )}
          </Button>

          {/* User Profile dropdown */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <Link href="/account/profile">
                <Button size="sm" variant="outline" className="h-8 gap-2 px-3 text-xs font-semibold">
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{user.firstName || user.email.split("@")[0]}</span>
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button size="sm" className="h-8 px-3 text-xs font-semibold">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="border-b border-border bg-card/95 px-4 py-4 backdrop-blur-xl md:hidden space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2 pt-2 border-t border-border/60">
            <Link
              href="/seller/dashboard"
              onClick={() => {
                switchRole("SELLER");
                setMobileOpen(false);
              }}
              className="flex-1 text-center rounded-lg border border-border py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              Seller Portal
            </Link>
            <Link
              href="/admin/dashboard"
              onClick={() => {
                switchRole("ADMIN");
                setMobileOpen(false);
              }}
              className="flex-1 text-center rounded-lg border border-border py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              Admin Plane
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
