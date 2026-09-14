import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}

export function RatingStars({ rating, reviewCount, size = "sm", showCount = true }: RatingStarsProps) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              starSize,
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            )}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs font-medium text-muted-foreground">
          {rating.toFixed(1)} {reviewCount ? `(${reviewCount})` : ""}
        </span>
      )}
    </div>
  );
}
