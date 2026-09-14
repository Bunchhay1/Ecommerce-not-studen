import React from "react";
import { formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceTag({ price, originalPrice, size = "md", className }: PriceTagProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const fontSizes = {
    sm: "text-base font-semibold",
    md: "text-lg font-bold",
    lg: "text-2xl font-black",
  };

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("text-foreground tracking-tight", fontSizes[size])}>
        {formatCurrency(price)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-xs text-muted-foreground line-through">
            {formatCurrency(originalPrice)}
          </span>
          <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
