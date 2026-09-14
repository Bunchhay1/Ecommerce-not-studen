import uuid
import pytest
from app.ml.content_similarity import ContentSimilarityEngine
from app.models.product_candidate import ProductCandidate


def test_content_similarity_ranking():
    engine = ContentSimilarityEngine()

    p1 = ProductCandidate(
        product_id=str(uuid.UUID("11111111-1111-1111-1111-111111111111")),
        name="Apple iPhone 15 Pro Max",
        description="Flagship Apple smartphone with titanium finish and A17 Pro.",
        category_name="Smartphones",
        brand_name="Apple",
        tags=["apple", "iphone", "smartphone", "ios"],
    )
    p2 = ProductCandidate(
        product_id=str(uuid.UUID("22222222-2222-2222-2222-222222222222")),
        name="Apple iPhone 15 Silicone Case",
        description="Protective silicone case for iPhone 15 with MagSafe.",
        category_name="Accessories",
        brand_name="Apple",
        tags=["apple", "iphone", "case", "magsafe"],
    )
    p3 = ProductCandidate(
        product_id=str(uuid.UUID("33333333-3333-3333-3333-333333333333")),
        name="Sony WH-1000XM5 Wireless Headphones",
        description="Industry leading noise canceling wireless Bluetooth headphones.",
        category_name="Audio",
        brand_name="Sony",
        tags=["sony", "headphones", "bluetooth", "anc"],
    )

    candidates = [p1, p2, p3]
    engine.fit(candidates)

    assert engine.is_fitted is True
    assert len(engine.product_ids) == 3

    # Find similar to iPhone 15
    similars = engine.find_similar(uuid.UUID(p1.product_id), top_k=5, min_similarity=0.01)
    assert len(similars) >= 1
    # Top similar should be the iPhone case (shares 'apple', 'iphone')
    top_similar_id, score = similars[0]
    assert top_similar_id == uuid.UUID(p2.product_id)
    assert score > 0.1


def test_empty_candidates():
    engine = ContentSimilarityEngine()
    engine.fit([])
    assert engine.is_fitted is False
    assert engine.find_similar(uuid.uuid4()) == []


def test_unknown_product_id():
    engine = ContentSimilarityEngine()
    p = ProductCandidate(
        product_id=str(uuid.uuid4()),
        name="Test Item",
        category_name="General",
    )
    engine.fit([p])
    assert engine.find_similar(uuid.uuid4()) == []
