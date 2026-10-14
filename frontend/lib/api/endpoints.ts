export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    REFRESH: "/api/v1/auth/refresh",
    ME: "/api/v1/auth/me",
    FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
    RESET_PASSWORD: "/api/v1/auth/reset-password",
  },
  USERS: {
    PROFILE: "/api/v1/users/me",
    ADDRESSES: "/api/v1/users/me/addresses",
  },
  CATALOG: {
    PRODUCTS: "/api/v1/products",
    CATEGORIES: "/api/v1/categories",
    PRODUCT_DETAIL: (id: string) => `/api/v1/products/${id}`,
  },
  SEARCH: {
    QUERY: "/api/v1/search",
    AUTOCOMPLETE: "/api/v1/search/autocomplete",
  },
  CART: {
    GET: "/api/v1/cart",
    ITEMS: "/api/v1/cart/items",
    ITEM: (id: string) => `/api/v1/cart/items/${id}`,
  },
  ORDERS: {
    LIST: "/api/v1/orders",
    CREATE: "/api/v1/orders",
    DETAIL: (id: string) => `/api/v1/orders/${id}`,
    CANCEL: (id: string) => `/api/v1/orders/${id}/cancel`,
  },
  PAYMENTS: {
    INTENT: "/api/v1/payments/intents",
  },
  SHIPPING: {
    RATES: "/api/v1/shipping/rates",
    TRACKING: (trackingNumber: string) => `/api/v1/shipping/tracking/${trackingNumber}`,
    ORDER: (orderId: string) => `/api/v1/shipping/orders/${orderId}`,
  },
  INVENTORY: {
    VARIANT: (variantId: string) => `/api/v1/inventory/${variantId}`,
    PRODUCT: (productId: string) => `/api/v1/inventory/product/${productId}`,
    CHECK: "/api/v1/inventory/check",
  },
  NOTIFICATIONS: {
    LIST: "/api/v1/notifications",
    READ: (id: string) => `/api/v1/notifications/${id}/read`,
  },
  PRICING: {
    CALCULATE: "/api/v1/pricing/calculate",
    PROMOTIONS: "/api/v1/promotions",
    PRICES: "/api/v1/prices",
  },
  REVIEWS: {
    LIST: (productId: string) => `/api/v1/reviews/products/${productId}`,
    CREATE: "/api/v1/reviews",
  },
  RECOMMENDATIONS: {
    HOME: "/api/v1/recommendations/trending",
    TRENDING: "/api/v1/recommendations/trending",
    PERSONALIZED: "/api/v1/recommendations/personalized",
    SIMILAR: (productId: string) => `/api/v1/recommendations/similar/${productId}`,
  },
  SELLER: {
    ME: "/api/v1/sellers/me",
    LISTINGS: "/api/v1/sellers/me/listings",
    ORDERS: "/api/v1/sellers/me/orders",
    STORE: (id: string) => `/api/v1/sellers/store/${id}`,
  },
  ADMIN: {
    DASHBOARD_SUMMARY: "/api/v1/admin/dashboard/summary",
    DASHBOARD_ALERTS: "/api/v1/admin/dashboard/alerts",
    DASHBOARD_TRENDS: "/api/v1/admin/dashboard/trends",
    USERS: "/api/v1/admin/users",
    SELLERS: "/api/v1/admin/sellers",
    PRODUCTS: "/api/v1/admin/catalog/products",
    ORDERS: "/api/v1/admin/orders",
    PAYMENTS: "/api/v1/admin/payments",
    INVENTORY: "/api/v1/admin/inventory",
    AUDIT_LOGS: "/api/v1/admin/audit-logs",
  },
};
