import uuid
from typing import List, Dict, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.product_candidate import ProductCandidate


class ContentSimilarityEngine:
    """
    Computes text and metadata similarity using TF-IDF vectorization and Cosine Similarity.
    Features used: product name, category name, brand, tags, and description.
    """

    def __init__(self, max_features: int = 5000):
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=max_features,
            ngram_range=(1, 2),
        )
        self.tfidf_matrix = None
        self.product_ids: List[str] = []
        self.id_to_idx: Dict[str, int] = {}
        self.idx_to_id: Dict[int, str] = {}
        self.is_fitted: bool = False

    def _prepare_corpus(self, candidates: List[ProductCandidate]) -> List[str]:
        corpus = []
        for p in candidates:
            tags_str = " ".join(p.tags) if p.tags else ""
            cat_str = p.category_name or ""
            brand_str = p.brand or ""
            name_str = p.name or ""
            desc_str = p.description or ""
            text = f"{name_str} {name_str} {cat_str} {cat_str} {brand_str} {tags_str} {desc_str}".strip()
            corpus.append(text)
        return corpus

    def fit(self, candidates: List[ProductCandidate]) -> None:
        if not candidates:
            self.is_fitted = False
            return

        self.product_ids = [str(p.product_id) for p in candidates]
        self.id_to_idx = {pid: idx for idx, pid in enumerate(self.product_ids)}
        self.idx_to_id = {idx: pid for idx, pid in enumerate(self.product_ids)}

        corpus = self._prepare_corpus(candidates)
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.is_fitted = True

    def find_similar(
        self,
        product_id: uuid.UUID | str,
        top_k: int = 10,
        min_similarity: float = 0.05,
    ) -> List[Tuple[uuid.UUID, float]]:
        pid_str = str(product_id)
        if not self.is_fitted or pid_str not in self.id_to_idx or self.tfidf_matrix is None:
            return []

        idx = self.id_to_idx[pid_str]
        product_vector = self.tfidf_matrix[idx]

        sim_scores = cosine_similarity(product_vector, self.tfidf_matrix).flatten()
        ranked_indices = np.argsort(sim_scores)[::-1]

        results: List[Tuple[uuid.UUID, float]] = []
        for r_idx in ranked_indices:
            if r_idx == idx:
                continue

            score = float(sim_scores[r_idx])
            if score < min_similarity:
                break

            target_id_str = self.idx_to_id[r_idx]
            try:
                target_uuid = uuid.UUID(target_id_str)
            except Exception:
                target_uuid = target_id_str  # type: ignore

            results.append((target_uuid, round(score, 4)))
            if len(results) >= top_k:
                break

        return results
