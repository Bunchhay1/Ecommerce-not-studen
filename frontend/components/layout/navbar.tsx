"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  Package,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { toggleCart, getItemCount } = useCartStore();
  const { user, activeRole, switchRole, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const itemCount = getItemCount();

  const isAdmin = activeRole === "ADMIN" || Boolean(user?.roles?.includes("ADMIN"));
  const isSeller = activeRole === "SELLER" || Boolean(user?.roles?.includes("SELLER")) || isAdmin;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Products", href: "/products" },
    { label: "Search", href: "/search" },
    { label: "Orders", href: "/orders" },
    ...(isAdmin ? [{ label: "Admin Panel", href: "/admin/dashboard" }] : []),
    ...(isSeller && !isAdmin ? [{ label: "Seller Hub", href: "/seller/dashboard" }] : []),
  ];

  const handleSignOut = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/auth/login");
  };

  return (
    <header className="glass-navbar sticky top-0 z-50">
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
          {/* Direct Admin Control Button if user is Admin */}
          {isAdmin && (
            <Link href="/admin/dashboard" onClick={() => switchRole("ADMIN")}>
              <Button
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-sm"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin Control</span>
              </Button>
            </Link>
          )}

          {/* Multi-Role Portal Switcher for wider screens */}
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

          {/* Interactive User Profile Dropdown */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="h-8 gap-1.5 px-2.5 sm:px-3 text-xs font-semibold"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase">
                  {(user.firstName || user.email)[0]}
                </div>
                <span className="hidden sm:inline font-bold">
                  {user.firstName || user.email.split("@")[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border/70 bg-card p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                  {/* User Profile Header */}
                  <div className="px-3 py-2 border-b border-border/60">
                    <p className="text-xs font-bold text-foreground">
                      {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge
                        variant={isAdmin ? "default" : isSeller ? "secondary" : "outline"}
                        className="text-[10px] px-2 py-0 font-bold uppercase"
                      >
                        {activeRole || (user.roles && user.roles[0]) || "CUSTOMER"}
                      </Badge>
                    </div>
                  </div>

                  {/* Navigation Links inside Menu */}
                  <div className="py-1 space-y-0.5 text-xs font-medium">
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => {
                          switchRole("ADMIN");
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-bold text-amber-500 hover:bg-amber-500/10 transition-colors"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Admin Control Plane</span>
                      </Link>
                    )}

                    {isSeller && (
                      <Link
                        href="/seller/dashboard"
                        onClick={() => {
                          switchRole("SELLER");
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground hover:bg-secondary transition-colors"
                      >
                        <Store className="h-4 w-4 text-primary" />
                        <span>Seller Dashboard</span>
                      </Link>
                    )}

                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground hover:bg-secondary transition-colors"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Order History</span>
                    </Link>

                    <Link
                      href="/account/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Account Settings</span>
                    </Link>
                  </div>

                  {/* Quick Portal Switcher inside Menu */}
                  <div className="pt-2 border-t border-border/60">
                    <p className="px-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Switch Role View
                    </p>
                    <div className="grid grid-cols-3 gap-1 px-1">
                      <button
                        onClick={() => {
                          switchRole("CUSTOMER");
                          setUserMenuOpen(false);
                        }}
                        className={`rounded-lg py-1 text-[11px] font-bold transition-all ${
                          activeRole === "CUSTOMER" ? "bg-primary text-white" : "hover:bg-secondary text-muted-foreground"
                        }`}
                      >
                        Shop
                      </button>
                      <button
                        onClick={() => {
                          switchRole("SELLER");
                          setUserMenuOpen(false);
                          router.push("/seller/dashboard");
                        }}
                        className={`rounded-lg py-1 text-[11px] font-bold transition-all ${
                          activeRole === "SELLER" ? "bg-primary text-white" : "hover:bg-secondary text-muted-foreground"
                        }`}
                      >
                        Seller
                      </button>
                      <button
                        onClick={() => {
                          switchRole("ADMIN");
                          setUserMenuOpen(false);
                          router.push("/admin/dashboard");
                        }}
                        className={`rounded-lg py-1 text-[11px] font-bold transition-all ${
                          activeRole === "ADMIN" ? "bg-primary text-white" : "hover:bg-secondary text-muted-foreground"
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2 border-t border-border/60">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
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
              className="flex-1 text-center rounded-lg border border-amber-500/40 bg-amber-500/10 py-1.5 text-xs font-bold text-amber-500 hover:bg-amber-500/20"
            >
              Admin Plane
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
