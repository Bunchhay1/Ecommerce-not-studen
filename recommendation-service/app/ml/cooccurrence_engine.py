import uuid
from typing import List, Dict, Tuple
from collections import defaultdict
import math


class CooccurrenceEngine:
    """
    Calculates item-to-item co-occurrence scores from user baskets and interaction sessions.
    Used for 'Frequently Bought Together' and 'Customers Also Viewed'.
    """

    def __init__(self, min_support: int = 1):
        self.min_support = min_support
        self.item_counts: Dict[uuid.UUID, int] = defaultdict(int)
        self.pair_counts: Dict[Tuple[uuid.UUID, uuid.UUID], int] = defaultdict(int)

    def fit_transactions(self, transactions: List[List[uuid.UUID | str]]) -> None:
        """
        Takes a list of baskets/sessions, each containing a list of product IDs.
        """
        self.item_counts.clear()
        self.pair_counts.clear()

        for basket in transactions:
            parsed_items: List[uuid.UUID] = []
            for item in basket:
                try:
                    parsed_items.append(uuid.UUID(str(item)))
                except Exception:
                    pass

            unique_items = list(set(parsed_items))
            # Increment individual item occurrences
            for item in unique_items:
                self.item_counts[item] += 1

            # Increment pairwise co-occurrences
            n = len(unique_items)
            for i in range(n):
                for j in range(i + 1, n):
                    p1, p2 = unique_items[i], unique_items[j]
                    self.pair_counts[(p1, p2)] += 1
                    self.pair_counts[(p2, p1)] += 1

    def get_related(
        self, product_id: uuid.UUID | str, top_k: int = 10
    ) -> List[Tuple[uuid.UUID, float, int]]:
        """
        Returns related product IDs with normalized cosine/Jaccard co-occurrence score and support count.
        """
        try:
            pid = uuid.UUID(str(product_id))
        except Exception:
            return []

        item_count = self.item_counts.get(pid, 0)
        if item_count == 0:
            return []

        candidates = []
        for (p1, p2), pair_count in self.pair_counts.items():
            if p1 == pid and pair_count >= self.min_support:
                other_count = self.item_counts.get(p2, 0)
                if other_count > 0:
                    score = pair_count / math.sqrt(item_count * other_count)
                    candidates.append((p2, round(score, 4), pair_count))

        candidates.sort(key=lambda x: (x[1], x[2]), reverse=True)
        return candidates[:top_k]
