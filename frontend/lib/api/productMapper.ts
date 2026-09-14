import { Product, ProductVariant } from "@/types/product";

export const SEEDED_PRICES: Record<string, { price: number; originalPrice: number }> = {
  "prd-mbp-m3": { price: 1949.00, originalPrice: 1999.00 },
  "prd-ip15-pro": { price: 1049.00, originalPrice: 1089.00 },
  "prd-btb-rice": { price: 8.90, originalPrice: 9.50 },
  "prd-kpt-pepper": { price: 5.75, originalPrice: 6.25 },
  "prd-mdk-coffee": { price: 6.99, originalPrice: 7.50 },
  "prd-silk-sampot": { price: 110.00, originalPrice: 120.00 },
};

export function mapToProduct(raw: any): Product {
  if (!raw) {
    throw new Error("Invalid product data");
  }

  const id = raw.id || raw.productId || raw.product_id || `prd-${Math.random().toString(36).substring(2, 7)}`;
  const title = raw.title || raw.name || "Cambodian Product";
  const slug = raw.slug || title.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
  const description = raw.description || "";

  // Category name extraction (can be string or object from Java Catalog Service)
  let category = "General";
  if (typeof raw.category === "object" && raw.category !== null) {
    category = raw.category.name || raw.category.title || "General";
  } else if (typeof raw.category === "string" && raw.category) {
    category = raw.category;
  } else if (raw.categoryName || raw.category_name) {
    category = raw.categoryName || raw.category_name;
  }

  // Brand name extraction
  let brand = "Authentic Cambodia";
  if (typeof raw.brand === "object" && raw.brand !== null) {
    brand = raw.brand.name || "Authentic Cambodia";
  } else if (typeof raw.brand === "string" && raw.brand) {
    brand = raw.brand;
  } else if (raw.brandName || raw.brand_name) {
    brand = raw.brandName || raw.brand_name;
  }

  // Images extraction (can be string[], or object[] { url: string, isPrimary: boolean })
  let images: string[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.map((img: any) => {
      if (typeof img === "string") return img;
      if (typeof img === "object" && img !== null) return img.url || img.imageUrl || "";
      return "";
    }).filter(Boolean);
  }
  if (images.length === 0 && (raw.thumbnail || raw.primary_image_url)) {
    images = [raw.thumbnail || raw.primary_image_url];
  }
  if (images.length === 0) {
    images = ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"];
  }

  const thumbnail = images[0];

  // Price resolution: check pricing seed map first if raw price is 0 or missing
  const seeded = SEEDED_PRICES[id];
  let price = Number(raw.price || raw.sale_price || raw.salePrice || 0);
  let originalPrice = Number(raw.originalPrice || raw.base_price || raw.basePrice || 0);

  if ((price === 0 || isNaN(price)) && seeded) {
    price = seeded.price;
    originalPrice = seeded.originalPrice;
  } else if (originalPrice === 0 && price > 0) {
    originalPrice = Math.round(price * 1.08 * 100) / 100;
  }

  // Variants extraction
  let variants: ProductVariant[] = [];
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants.map((v: any, idx: number) => ({
      id: v.id || `var-${idx}`,
      sku: v.sku || `SKU-${id.toUpperCase()}-${idx + 1}`,
      name: v.name || v.sku || "Standard",
      price: Number(v.price || price),
      originalPrice: Number(v.originalPrice || originalPrice),
      availableStock: Number(v.availableStock || v.stock || 50),
      attributes: v.attributes || {},
    }));
  } else {
    variants = [
      {
        id: `var-${id}-def`,
        sku: `SKU-${id.toUpperCase()}`,
        name: "Standard Edition",
        price,
        originalPrice,
        availableStock: 50,
        attributes: {},
      }
    ];
  }

  return {
    id,
    title,
    slug,
    description,
    category,
    brand,
    price,
    originalPrice,
    images,
    thumbnail,
    rating: Number(raw.rating || 4.9),
    reviewCount: Number(raw.reviewCount || raw.review_count || 128),
    variants,
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ["Verified Local", "Official Warranty"],
    inStock: raw.inStock !== undefined ? Boolean(raw.inStock) : true,
    sellerId: raw.sellerId || "sel-1",
    sellerName: raw.sellerName || "Verified Cambodian Merchant",
    featured: raw.featured !== undefined ? Boolean(raw.featured) : true,
  };
}
