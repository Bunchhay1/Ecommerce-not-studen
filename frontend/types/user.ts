export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[]; // "CUSTOMER", "SELLER", "ADMIN", "SUPER_ADMIN", etc.
  createdAt?: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  sellerCode: string;
  displayName: string;
  businessName: string;
  businessEmail: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  commissionRate: number;
  totalSales: number;
  rating: number;
}
