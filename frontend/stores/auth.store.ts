import { create } from "zustand";
import { UserProfile } from "@/types/user";
import { MOCK_USERS } from "@/lib/api/mockData";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  activeRole: "CUSTOMER" | "SELLER" | "ADMIN";
  isAuthenticated: boolean;
  login: (email: string, role?: "CUSTOMER" | "SELLER" | "ADMIN") => void;
  logout: () => void;
  switchRole: (role: "CUSTOMER" | "SELLER" | "ADMIN") => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USERS.customer,
  token: "mock-jwt-token-dev-2026",
  activeRole: "CUSTOMER",
  isAuthenticated: true,

  login: (email: string, role = "CUSTOMER") => {
    let profile = MOCK_USERS.customer;
    if (role === "SELLER") profile = MOCK_USERS.seller;
    if (role === "ADMIN") profile = MOCK_USERS.admin;

    profile = { ...profile, email: email || profile.email };

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", "mock-jwt-token-dev-2026");
    }

    set({
      user: profile,
      token: "mock-jwt-token-dev-2026",
      activeRole: role,
      isAuthenticated: true,
    });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  switchRole: (role: "CUSTOMER" | "SELLER" | "ADMIN") => {
    let profile = MOCK_USERS.customer;
    if (role === "SELLER") profile = MOCK_USERS.seller;
    if (role === "ADMIN") profile = MOCK_USERS.admin;

    set({
      user: profile,
      activeRole: role,
    });
  },
}));
