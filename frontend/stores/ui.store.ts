import { create } from "zustand";

interface UIState {
  isSearchOpen: boolean;
  isNotificationsOpen: boolean;
  theme: "light" | "dark";
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isNotificationsOpen: false,
  theme: "dark",

  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  openNotifications: () => set({ isNotificationsOpen: true }),
  closeNotifications: () => set({ isNotificationsOpen: false }),
  toggleNotifications: () => set((state) => ({ isNotificationsOpen: !state.isNotificationsOpen })),

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      }
      return { theme: nextTheme };
    }),
}));
