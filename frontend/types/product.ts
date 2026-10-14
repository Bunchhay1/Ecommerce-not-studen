export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  originalPrice?: number;
  availableStock: number;
  attributes: Record<string, string>; // e.g. { color: "Space Black", storage: "256GB" }
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  categoryParentId?: string;
  brand: string;
  brandId?: string;
  brandSlug?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  thumbnail: string;
  rating: number;
  reviewCount: number;
  variants: ProductVariant[];
  tags: string[];
  inStock: boolean;
  sellerId?: string;
  sellerName?: string;
  featured?: boolean;
}

export interface Category {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productCount?: number;
}
