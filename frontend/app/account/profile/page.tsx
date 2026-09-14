"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, ShieldCheck, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const router = useRouter();
  const { user, activeRole, logout, switchRole } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-black tracking-tight">Account Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage personal identity, verified roles, and session access</p>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-xl">
            {user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="text-[10px] font-bold">
                Active View: {activeRole}
              </Badge>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40 text-xs">
          <div className="rounded-xl border border-border/60 p-4 space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
              <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
            </span>
            <p className="font-bold text-foreground text-sm">{user.email}</p>
          </div>

          <div className="rounded-xl border border-border/60 p-4 space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
              <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number
            </span>
            <p className="font-bold text-foreground text-sm">{user.phone || "+1 (555) 382-9102"}</p>
          </div>
        </div>

        {/* Switch Persona */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Switch Perspective / Portal:
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeRole === "CUSTOMER" ? "default" : "outline"}
              onClick={() => switchRole("CUSTOMER")}
              className="text-xs font-semibold"
            >
              Customer Storefront
            </Button>
            <Button
              size="sm"
              variant={activeRole === "SELLER" ? "default" : "outline"}
              onClick={() => {
                switchRole("SELLER");
                router.push("/seller/dashboard");
              }}
              className="text-xs font-semibold"
            >
              Seller Dashboard
            </Button>
            <Button
              size="sm"
              variant={activeRole === "ADMIN" ? "default" : "outline"}
              onClick={() => {
                switchRole("ADMIN");
                router.push("/admin/dashboard");
              }}
              className="text-xs font-semibold"
            >
              Super Admin Control Plane
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex justify-end">
          <Button variant="destructive" onClick={handleLogout} className="gap-2 font-bold">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
