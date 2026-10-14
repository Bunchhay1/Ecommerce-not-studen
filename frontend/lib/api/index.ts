import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      return res.data;
    },
    register: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
      return res.data;
    },
    me: async () => {
      const res = await apiClient.get(API_ENDPOINTS.AUTH.ME);
      return res.data;
    },
    refresh: async (refreshToken: string) => {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
      return res.data;
    },
    forgotPassword: async (email: string) => {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return res.data;
    },
    resetPassword: async (data: { token: string; newPassword: string }) => {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
      return res.data;
    },
  },

  users: {
    getProfile: async () => {
      const res = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
      return res.data;
    },
    updateProfile: async (data: any) => {
      const res = await apiClient.patch(API_ENDPOINTS.USERS.PROFILE, data);
      return res.data;
    },
    getAddresses: async () => {
      const res = await apiClient.get(API_ENDPOINTS.USERS.ADDRESSES);
      return res.data;
    },
    addAddress: async (data: any) => {
      const res = await apiClient.post(API_ENDPOINTS.USERS.ADDRESSES, data);
      return res.data;
    },
  },

  products: {
    getAll: async (params?: Record<string, any>) => {
      const res = await apiClient.get(API_ENDPOINTS.CATALOG.PRODUCTS, { params });
      return res.data;
    },
    getById: async (id: string) => {
      const res = await apiClient.get(API_ENDPOINTS.CATALOG.PRODUCT_DETAIL(id));
      return res.data;
    },
    getCategories: async () => {
      const res = await apiClient.get(API_ENDPOINTS.CATALOG.CATEGORIES);
      return res.data;
    },
  },

  search: {
    query: async (q: string, params?: Record<string, any>) => {
      const res = await apiClient.get(API_ENDPOINTS.SEARCH.QUERY, { params: { q, ...params } });
      return res.data;
    },
    autocomplete: async (q: string) => {
      const res = await apiClient.get(API_ENDPOINTS.SEARCH.AUTOCOMPLETE, { params: { q } });
      return res.data;
    },
  },

  cart: {
    get: async () => {
      const res = await apiClient.get(API_ENDPOINTS.CART.GET);
      return res.data;
    },
    addItem: async (item: { productId: string; variantId: string; quantity: number; price?: number; title?: string }) => {
      const res = await apiClient.post(API_ENDPOINTS.CART.ITEMS, item);
      return res.data;
    },
    updateItem: async (itemId: string, quantity: number) => {
      const res = await apiClient.patch(API_ENDPOINTS.CART.ITEM(itemId), { quantity });
      return res.data;
    },
    removeItem: async (itemId: string) => {
      const res = await apiClient.delete(API_ENDPOINTS.CART.ITEM(itemId));
      return res.data;
    },
  },

  inventory: {
    getByVariantId: async (variantId: string) => {
      const res = await apiClient.get(API_ENDPOINTS.INVENTORY.VARIANT(variantId));
      return res.data;
    },
    getByProductId: async (productId: string) => {
      const res = await apiClient.get(API_ENDPOINTS.INVENTORY.PRODUCT(productId));
      return res.data;
    },
    checkStock: async (items: Array<{ variantId: string; quantity: number }>) => {
      const res = await apiClient.post(API_ENDPOINTS.INVENTORY.CHECK, { items });
      return res.data;
    },
  },

  orders: {
    list: async () => {
      const res = await apiClient.get(API_ENDPOINTS.ORDERS.LIST);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await apiClient.get(API_ENDPOINTS.ORDERS.DETAIL(id));
      return res.data;
    },
    get: async (id: string) => {
      const res = await apiClient.get(API_ENDPOINTS.ORDERS.DETAIL(id));
      return res.data;
    },
    create: async (payload: any, idempotencyKey?: string) => {
      const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {};
      const res = await apiClient.post(API_ENDPOINTS.ORDERS.CREATE, payload, { headers });
      return res.data;
    },
    cancel: async (id: string, reason?: string) => {
      const res = await apiClient.post(API_ENDPOINTS.ORDERS.CANCEL(id), { reason });
      return res.data;
    },
  },

  payments: {
    createIntent: async (data: any) => {
      const res = await apiClient.post(API_ENDPOINTS.PAYMENTS.INTENT, data);
      return res.data;
    },
  },

  shipping: {
    getRates: async (params?: Record<string, any>) => {
      const res = await apiClient.get(API_ENDPOINTS.SHIPPING.RATES, { params });
      return res.data;
    },
    getTracking: async (trackingNumber: string) => {
      const res = await apiClient.get(API_ENDPOINTS.SHIPPING.TRACKING(trackingNumber));
      return res.data;
    },
    getByOrder: async (orderId: string) => {
      const res = await apiClient.get(API_ENDPOINTS.SHIPPING.ORDER(orderId));
      return res.data;
    },
  },

  pricing: {
    calculate: async (payload: any) => {
      const res = await apiClient.post(API_ENDPOINTS.PRICING.CALCULATE, payload);
      return res.data;
    },
    getPromotions: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PRICING.PROMOTIONS);
      return res.data;
    },
  },

  reviews: {
    getByProductId: async (productId: string) => {
      const res = await apiClient.get(API_ENDPOINTS.REVIEWS.LIST(productId));
      return res.data;
    },
    create: async (data: any) => {
      const res = await apiClient.post(API_ENDPOINTS.REVIEWS.CREATE, data);
      return res.data;
    },
  },

  recommendations: {
    getHome: async () => {
      const res = await apiClient.get(API_ENDPOINTS.RECOMMENDATIONS.HOME);
      return res.data;
    },
    getSimilar: async (productId: string) => {
      const res = await apiClient.get(API_ENDPOINTS.RECOMMENDATIONS.SIMILAR(productId));
      return res.data;
    },
  },

  notifications: {
    list: async () => {
      const res = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      return res.data;
    },
    markRead: async (id: string) => {
      const res = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.READ(id));
      return res.data;
    },
  },

  seller: {
    getMe: async () => {
      const res = await apiClient.get(API_ENDPOINTS.SELLER.ME);
      return res.data;
    },
    getListings: async () => {
      const res = await apiClient.get(API_ENDPOINTS.SELLER.LISTINGS);
      return res.data;
    },
    getOrders: async () => {
      const res = await apiClient.get(API_ENDPOINTS.SELLER.ORDERS);
      return res.data;
    },
    getStore: async (id: string) => {
      const res = await apiClient.get(API_ENDPOINTS.SELLER.STORE(id));
      return res.data;
    },
  },

  admin: {
    getDashboardSummary: async () => {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD_SUMMARY);
      return res.data;
    },
    getDashboardAlerts: async () => {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD_ALERTS);
      return res.data;
    },
    getUsers: async () => {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.USERS);
      return res.data;
    },
    getSellers: async () => {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.SELLERS);
      return res.data;
    },
    getOrders: async () => {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.ORDERS);
      return res.data;
    },
  },
};

export default api;
