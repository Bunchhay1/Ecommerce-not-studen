import uuid
from typing import List
from app.schemas.recommendation import RecommendationItem, RecommendationQuery


class RankingService:
    """
    Applies post-candidate ranking, filtering (price, category, stock), and diversity rules.
    """

    @staticmethod
    def filter_and_rank(
        items: List[RecommendationItem],
        query: RecommendationQuery,
    ) -> List[RecommendationItem]:
        filtered: List[RecommendationItem] = []
        excluded_set = set(query.exclude_product_ids or [])

        for item in items:
            # Exclude specified product IDs
            if item.product_id in excluded_set:
                continue

            # Stock availability check
            if query.only_in_stock and not item.is_in_stock:
                continue

            # Category filter
            if query.category_id and item.category_id != query.category_id:
                continue

            # Price bounds
            if item.price is not None:
                if query.min_price is not None and item.price < query.min_price:
                    continue
                if query.max_price is not None and item.price > query.max_price:
                    continue

            filtered.append(item)

        # Sort by score descending
        filtered.sort(key=lambda x: x.score, reverse=True)

        # Pagination: offset and limit
        start = query.offset
        end = query.offset + query.limit
        return filtered[start:end]
