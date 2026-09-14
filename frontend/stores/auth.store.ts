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

function parseJwtRoles(token: string): string[] {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return [];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    if (Array.isArray(parsed.roles)) return parsed.roles;
    if (parsed.role) return [parsed.role];
    return [];
  } catch {
    return [];
  }
}

function setAuthCookies(token: string | null, role: string) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `userRole=${role}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    document.cookie = "accessToken=; path=/; max-age=0";
    document.cookie = "userRole=; path=/; max-age=0";
  }
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
        const jwtRoles = parseJwtRoles(token);
        const resolvedRole: "CUSTOMER" | "SELLER" | "ADMIN" =
          jwtRoles.includes("ADMIN") || role === "ADMIN"
            ? "ADMIN"
            : jwtRoles.includes("SELLER") || role === "SELLER"
            ? "SELLER"
            : "CUSTOMER";

        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", token);
          localStorage.setItem("userRole", resolvedRole);
        }
        setAuthCookies(token, resolvedRole);

        // Try to fetch profile from User Service
        let profile = MOCK_USERS.customer;
        if (resolvedRole === "SELLER") profile = MOCK_USERS.seller;
        if (resolvedRole === "ADMIN") profile = MOCK_USERS.admin;

        try {
          const userRes = await apiClient.get(API_ENDPOINTS.USERS.PROFILE, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = userRes.data?.data || userRes.data;
          if (d) {
            profile = {
              id: d.user_id || d.id || profile.id,
              email: d.email || email || profile.email,
              firstName: d.first_name || d.firstName || profile.firstName,
              lastName: d.last_name || d.lastName || profile.lastName,
              phone: d.phone || profile.phone,
              roles: jwtRoles.length > 0 ? jwtRoles : [resolvedRole],
            };
          }
        } catch {
          profile = { ...profile, email: email || profile.email, roles: [resolvedRole] };
        }

        set({
          user: profile,
          token,
          activeRole: resolvedRole,
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
    profile = { ...profile, email: email || profile.email, roles: [role] };

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", "mock-jwt-token-dev-2026");
      localStorage.setItem("userRole", role);
    }
    setAuthCookies("mock-jwt-token-dev-2026", role);

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
      localStorage.removeItem("userRole");
    }
    setAuthCookies(null, "CUSTOMER");
    set({
      user: null,
      token: null,
      activeRole: "CUSTOMER",
      isAuthenticated: false,
      isLoading: false,
    });
  },

  switchRole: (role: "CUSTOMER" | "SELLER" | "ADMIN") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", role);
      const token = localStorage.getItem("accessToken");
      setAuthCookies(token, role);
    }
    let profile = MOCK_USERS.customer;
    if (role === "SELLER") profile = MOCK_USERS.seller;
    if (role === "ADMIN") profile = MOCK_USERS.admin;

    set((state) => ({
      user: state.user ? { ...state.user, roles: [role] } : profile,
      activeRole: role,
    }));
  },

  restoreSession: async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const jwtRoles = parseJwtRoles(token);
    const savedRole = (localStorage.getItem("userRole") as "CUSTOMER" | "SELLER" | "ADMIN" | null) || "CUSTOMER";
    const resolvedRole: "CUSTOMER" | "SELLER" | "ADMIN" =
      jwtRoles.includes("ADMIN") || savedRole === "ADMIN"
        ? "ADMIN"
        : jwtRoles.includes("SELLER") || savedRole === "SELLER"
        ? "SELLER"
        : "CUSTOMER";

    setAuthCookies(token, resolvedRole);

    let baseProfile = MOCK_USERS.customer;
    if (resolvedRole === "SELLER") baseProfile = MOCK_USERS.seller;
    if (resolvedRole === "ADMIN") baseProfile = MOCK_USERS.admin;

    try {
      const userRes = await apiClient.get(API_ENDPOINTS.USERS.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = userRes.data?.data || userRes.data;
      if (d) {
        set({
          token,
          user: {
            id: d.user_id || d.id || baseProfile.id,
            email: d.email || baseProfile.email,
            firstName: d.first_name || d.firstName || baseProfile.firstName,
            lastName: d.last_name || d.lastName || baseProfile.lastName,
            phone: d.phone || baseProfile.phone,
            roles: jwtRoles.length > 0 ? jwtRoles : [resolvedRole],
          },
          activeRole: resolvedRole,
          isAuthenticated: true,
        });
        return;
      }
    } catch {
      // Keep existing or fallback state
    }

    set({
      token,
      user: {
        ...baseProfile,
        roles: jwtRoles.length > 0 ? jwtRoles : [resolvedRole],
      },
      activeRole: resolvedRole,
      isAuthenticated: true,
    });
  },
}));

