import React from "react";
import { formatCurrency, formatKHR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg";
  showKHR?: boolean;
  className?: string;
}

export function PriceTag({ price, originalPrice, size = "md", showKHR = true, className }: PriceTagProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const fontSizes = {
    sm: "text-sm font-bold",
    md: "text-lg font-bold",
    lg: "text-2xl sm:text-3xl font-black",
  };

  const khrFontSizes = {
    sm: "text-[11px]",
    md: "text-xs",
    lg: "text-sm font-semibold",
  };

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("text-foreground tracking-tight", fontSizes[size])}>
        {formatCurrency(price)}
      </span>
      {showKHR && (
        <span className={cn("text-muted-foreground font-medium", khrFontSizes[size])}>
          ({formatKHR(price)})
        </span>
      )}
      {hasDiscount && (
        <>
          <span className="text-xs text-muted-foreground line-through">
            {formatCurrency(originalPrice)}
          </span>
          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500 border border-rose-500/20">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
