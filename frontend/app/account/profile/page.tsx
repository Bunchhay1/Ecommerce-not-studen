"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  MapPin,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Globe,
  DollarSign,
  Bell,
  Building2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const CAMBODIA_PROVINCES = [
  "Phnom Penh",
  "Siem Reap",
  "Battambang",
  "Kandal",
  "Preah Sihanouk (Sihanoukville)",
  "Kampot",
  "Kampong Cham",
  "Kampong Chhnang",
  "Kampong Speu",
  "Kampong Thom",
  "Kep",
  "Koh Kong",
  "Kratie",
  "Mondulkiri",
  "Otdar Meanchey",
  "Pailin",
  "Preah Vihear",
  "Prey Veng",
  "Pursat",
  "Ratanakiri",
  "Stung Treng",
  "Svay Rieng",
  "Takeo",
  "Tbong Khmum",
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, activeRole, logout, switchRole } = useAuthStore();

  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [preferredLang, setPreferredLang] = useState("en");

  // Cambodia Address Book
  const [addresses, setAddresses] = useState([
    {
      id: "addr-kh-1",
      isDefault: true,
      recipientName: "Sok Dara",
      phone: "+855 12 888 999",
      province: "Phnom Penh",
      district: "Khan Daun Penh",
      commune: "Sangkat Chey Chumneah",
      street: "Building 42, Street 214 (Samdach Pan Ave)",
      notes: "Opposite pencil supermarket",
    },
    {
      id: "addr-kh-2",
      isDefault: false,
      recipientName: "Sok Dara (Office)",
      phone: "+855 12 888 999",
      province: "Phnom Penh",
      district: "Khan Chamkarmon",
      commune: "Sangkat Boeung Keng Kang 1",
      street: "St. 310, Corner St. 57, Vattanac Tower Area",
      notes: "Call upon arrival at lobby",
    },
  ]);

  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("+855 ");
  const [newProvince, setNewProvince] = useState("Phnom Penh");
  const [newDistrict, setNewDistrict] = useState("");
  const [newCommune, setNewCommune] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newStreet) return;
    const newEntry = {
      id: `addr-kh-${Date.now()}`,
      isDefault: addresses.length === 0,
      recipientName: newName,
      phone: newPhone,
      province: newProvince,
      district: newDistrict || "Central District",
      commune: newCommune || "Central Commune",
      street: newStreet,
      notes: newNotes,
    };
    setAddresses([...addresses, newEntry]);
    setShowAddAddressModal(false);
    setNewName("");
    setNewPhone("+855 ");
    setNewStreet("");
    setNewNotes("");
  };

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Customer Profile</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Identity managed by Auth (:8001) & User Service (:8002)
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleLogout}
          className="text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10 self-start sm:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </Button>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-3xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-white font-black text-2xl shadow-lg shadow-primary/20">
            {user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">
                {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
              </h2>
              <Badge variant="success" className="text-[10px] gap-1 font-bold">
                <ShieldCheck className="h-3 w-3" /> VERIFIED BUYER
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40 text-xs">
          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
              <Mail className="h-3.5 w-3.5 text-primary" /> Primary Email
            </span>
            <p className="font-bold text-foreground text-sm">{user.email}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
              <Phone className="h-3.5 w-3.5 text-primary" /> Cambodia Mobile
            </span>
            <p className="font-bold text-foreground text-sm font-mono">{user.phone || "+855 12 888 999"}</p>
          </div>
        </div>
      </div>

      {/* Cambodia Address Book (Section 10 & 36) */}
      <div className="rounded-3xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Cambodian Delivery Addresses</h3>
              <p className="text-xs text-muted-foreground">Synchronized with User Service #03 • Used for domestic dispatch</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setShowAddAddressModal(true)}
            className="text-xs font-bold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add Address
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl border p-5 transition-all text-xs space-y-2 ${
                addr.isDefault
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/60 bg-secondary/20"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{addr.recipientName}</span>
                  {addr.isDefault ? (
                    <span className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Default Address
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-[11px] text-muted-foreground hover:text-primary font-semibold"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="text-muted-foreground">
                {addr.street}, {addr.commune}, {addr.district}, {addr.province}, Cambodia
              </p>
              {addr.notes && (
                <p className="text-[11px] text-muted-foreground italic">Note: {addr.notes}</p>
              )}
              <p className="font-mono text-muted-foreground text-[11px]">{addr.phone}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences (USD/KHR & Language) */}
      <div className="rounded-3xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm space-y-5">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Regional Preferences (Cambodia)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl border border-border/60 p-4 space-y-2">
            <span className="font-semibold text-muted-foreground block">Authoritative Currency Display</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreferredCurrency("USD")}
                className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-colors ${
                  preferredCurrency === "USD"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setPreferredCurrency("KHR")}
                className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-colors ${
                  preferredCurrency === "KHR"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                KHR (៛) - 4,100 Rate
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 p-4 space-y-2">
            <span className="font-semibold text-muted-foreground block">System Language</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreferredLang("en")}
                className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-colors ${
                  preferredLang === "en"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                English (US)
              </button>
              <button
                type="button"
                onClick={() => setPreferredLang("km")}
                className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-colors ${
                  preferredLang === "km"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                ភាសាខ្មែរ (Khmer)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Actor Perspective Switcher */}
      <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Switch Actor Perspective:
        </h3>
        <p className="text-xs text-muted-foreground">
          BC-Market unified codebase serves Customer Storefront, Seller Portal, and Super Admin Control Plane.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-2">
          <Button
            size="sm"
            variant={activeRole === "CUSTOMER" ? "default" : "outline"}
            onClick={() => {
              switchRole("CUSTOMER");
              router.push("/products");
            }}
            className="text-xs font-bold"
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
            className="text-xs font-bold"
          >
            Seller Marketplace Portal
          </Button>
          <Button
            size="sm"
            variant={activeRole === "ADMIN" ? "default" : "outline"}
            onClick={() => {
              switchRole("ADMIN");
              router.push("/admin/dashboard");
            }}
            className="text-xs font-bold"
          >
            Super Admin Control Plane
          </Button>
        </div>
      </div>

      {/* Modal: Add New Address */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base">Add Cambodian Delivery Address</h3>
              <button
                onClick={() => setShowAddAddressModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground mb-1 block">Recipient Name *</label>
                <Input
                  placeholder="e.g. Sok Dara"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground mb-1 block">Phone Number (+855) *</label>
                <Input
                  placeholder="+855 12 888 999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground mb-1 block">Province / City *</label>
                <select
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                >
                  {CAMBODIA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground mb-1 block">Khan / District</label>
                  <Input
                    placeholder="e.g. Daun Penh"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground mb-1 block">Sangkat / Commune</label>
                  <Input
                    placeholder="e.g. Chey Chumneah"
                    value={newCommune}
                    onChange={(e) => setNewCommune(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground mb-1 block">
                  Street, Building & Number *
                </label>
                <Input
                  placeholder="e.g. Building 42, Street 214"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground mb-1 block">Delivery Instructions</label>
                <Input
                  placeholder="e.g. Near pencil supermarket, call when arriving"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddAddressModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-bold">
                  Save Address
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
