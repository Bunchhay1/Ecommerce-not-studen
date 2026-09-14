import { create } from "zustand";
import { UserProfile } from "@/types/user";
import { MOCK_USERS } from "@/lib/api/mockData";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  activeRole: "CUSTOMER" | "SELLER" | "ADMIN";
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, role?: "CUSTOMER" | "SELLER" | "ADMIN") => Promise<boolean>;
  logout: () => void;
  switchRole: (role: "CUSTOMER" | "SELLER" | "ADMIN") => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: MOCK_USERS.customer,
  token: null,
  activeRole: "CUSTOMER",
  isAuthenticated: true,
  isLoading: false,

  login: async (email: string, password = "Password123!", role = "CUSTOMER") => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      const token = res.data?.access_token || res.data?.data?.access_token;

      if (token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", token);
        }

        // Try to fetch profile from User Service
        let profile = MOCK_USERS.customer;
        try {
          const userRes = await apiClient.get(API_ENDPOINTS.USERS.PROFILE, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userRes.data?.data) {
            const d = userRes.data.data;
            profile = {
              id: d.id,
              email: d.email,
              firstName: d.first_name || d.firstName,
              lastName: d.last_name || d.lastName,
              phone: d.phone,
              roles: [role],
            };
          }
        } catch {
          if (role === "SELLER") profile = MOCK_USERS.seller;
          if (role === "ADMIN") profile = MOCK_USERS.admin;
          profile = { ...profile, email };
        }

        set({
          user: profile,
          token,
          activeRole: role,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
    } catch (err) {
      console.warn("Real login failed, fallback to demo state:", err);
    }

    // Fallback if offline
    let profile = MOCK_USERS.customer;
    if (role === "SELLER") profile = MOCK_USERS.seller;
    if (role === "ADMIN") profile = MOCK_USERS.admin;
    profile = { ...profile, email: email || profile.email };

    set({
      user: profile,
      token: "mock-jwt-token-dev-2026",
      activeRole: role,
      isAuthenticated: true,
      isLoading: false,
    });
    return true;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
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

  restoreSession: async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const userRes = await apiClient.get(API_ENDPOINTS.USERS.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.data?.data) {
        const d = userRes.data.data;
        set({
          token,
          user: {
            id: d.id,
            email: d.email,
            firstName: d.first_name || d.firstName,
            lastName: d.last_name || d.lastName,
            phone: d.phone,
            roles: ["CUSTOMER"],
          },
          isAuthenticated: true,
        });
      }
    } catch {
      // Keep existing state
    }
  },
}));

