import { Product, ProductVariant } from "@/types/product";

export function mapToProduct(raw: any, priceMap?: Record<string, { price: number; originalPrice: number }>): Product {
  if (!raw) {
    throw new Error("Invalid product data");
  }

  const id = raw.id || raw.productId || raw.product_id || `prd-${Math.random().toString(36).substring(2, 7)}`;
  const title = raw.title || raw.name || "Global Product";
  const slug = raw.slug || title.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
  const description = raw.description || "";

  // Category name & metadata extraction
  let category = "General";
  let categoryId = "";
  let categorySlug = "";
  let categoryParentId = "";

  if (typeof raw.category === "object" && raw.category !== null) {
    category = raw.category.name || raw.category.title || "General";
    categoryId = raw.category.id || "";
    categorySlug = raw.category.slug || "";
    categoryParentId = raw.category.parentId || raw.category.parent_id || "";
  } else if (typeof raw.category === "string" && raw.category) {
    category = raw.category;
  }
  if (!categoryId && (raw.categoryId || raw.category_id)) {
    categoryId = raw.categoryId || raw.category_id;
  }
  if (!categorySlug && (raw.categorySlug || raw.category_slug)) {
    categorySlug = raw.categorySlug || raw.category_slug;
  }
  if (!categoryParentId && (raw.categoryParentId || raw.category_parent_id)) {
    categoryParentId = raw.categoryParentId || raw.category_parent_id;
  }

  // Brand name extraction
  let brand = "Official Brand";
  let brandId = "";
  let brandSlug = "";

  if (typeof raw.brand === "object" && raw.brand !== null) {
    brand = raw.brand.name || "Official Brand";
    brandId = raw.brand.id || "";
    brandSlug = raw.brand.slug || "";
  } else if (typeof raw.brand === "string" && raw.brand) {
    brand = raw.brand;
  }
  if (!brandId && (raw.brandId || raw.brand_id)) {
    brandId = raw.brandId || raw.brand_id;
  }
  if (!brandSlug && (raw.brandSlug || raw.brand_slug)) {
    brandSlug = raw.brandSlug || raw.brand_slug;
  }

  // Images extraction (string[], or object[] { url: string, isPrimary: boolean })
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

  // Price resolution: check priceMap, then raw price, then fallback
  const mappedPrice = priceMap && priceMap[id];
  let price = Number(raw.price || raw.sale_price || raw.salePrice || 0);
  let originalPrice = Number(raw.originalPrice || raw.base_price || raw.basePrice || 0);

  if (mappedPrice) {
    price = mappedPrice.price;
    originalPrice = mappedPrice.originalPrice;
  } else if (price > 0 && originalPrice === 0) {
    originalPrice = Math.round(price * 1.08 * 100) / 100;
  }

  if (price === 0 || isNaN(price)) {
    const num = parseInt(id.replace(/\D/g, ""), 10) || 1;
    price = 50 + (num * 17) % 800;
    originalPrice = Math.round(price * 1.15 * 100) / 100;
  }

  // Variants extraction
  let variants: ProductVariant[] = [];
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants.map((v: any, idx: number) => ({
      id: v.id || `var-${idx}`,
      sku: v.sku || `SKU-${id.toUpperCase()}-${idx + 1}`,
      name: v.name || v.sku || "Standard Edition",
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
    categoryId,
    categorySlug,
    categoryParentId,
    brand,
    brandId,
    brandSlug,
    price,
    originalPrice,
    images,
    thumbnail,
    rating: Number(raw.rating || 4.9),
    reviewCount: Number(raw.reviewCount || raw.review_count || 98),
    variants,
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ["Verified Brand", "Official Warranty"],
    inStock: raw.inStock !== undefined ? Boolean(raw.inStock) : true,
    sellerId: raw.sellerId || "sel-01",
    sellerName: raw.sellerName || "Verified Flagship Store",
    featured: raw.featured !== undefined ? Boolean(raw.featured) : true,
  };
}
