"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, Lock, Mail, ArrowRight, ShieldCheck, Store, User } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("sok.dara@synth-mail.kh");
  const [password, setPassword] = useState("Password123!");
  const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "SELLER" | "ADMIN">("CUSTOMER");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const ok = await login(email, password, selectedRole);
      if (ok) {
        if (selectedRole === "SELLER") router.push("/seller/dashboard");
        else if (selectedRole === "ADMIN") router.push("/admin/dashboard");
        else router.push("/products");
      } else {
        setLoginError("Invalid credentials or server unavailable.");
      }
    } catch (err: any) {
      setLoginError(err?.response?.data?.detail || "Authentication failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRoleSelect = (role: "CUSTOMER" | "SELLER" | "ADMIN", demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword("Password123!");
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border/70 bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Logo size="lg" showSubtitle={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Sign in to BC-Market</h1>
          <p className="text-xs text-muted-foreground">
            Authenticated via API Gateway :8000 with JWT token authorization
          </p>
        </div>

        {/* Demo Fast-Switch Role Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground block text-center">
            Quick-Select Seeded Persona (Cambodia Production Data):
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRoleSelect("CUSTOMER", "sok.dara@synth-mail.kh")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === "CUSTOMER"
                  ? "border-primary bg-primary/10 font-bold text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <User className="h-4 w-4 mb-1" />
              <span className="text-[11px]">Customer (Dara)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect("SELLER", "bunly.rithy@phnompenhcomputer.kh")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === "SELLER"
                  ? "border-primary bg-primary/10 font-bold text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Store className="h-4 w-4 mb-1" />
              <span className="text-[11px]">Seller (Rithy)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect("ADMIN", "admin.boran@marketplace.kh")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === "ADMIN"
                  ? "border-primary bg-primary/10 font-bold text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <ShieldCheck className="h-4 w-4 mb-1" />
              <span className="text-[11px]">Admin (Boran)</span>
            </button>
          </div>
        </div>

        {loginError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive text-center font-semibold">
            {loginError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full font-bold shadow-lg shadow-primary/20 gap-2">
            Sign In as {selectedRole} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
