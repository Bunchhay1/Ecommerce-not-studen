import uuid
import pytest
from app.ml.cooccurrence_engine import CooccurrenceEngine


def test_basket_cooccurrence():
    engine = CooccurrenceEngine(min_support=1)

    p_phone = uuid.UUID("11111111-1111-1111-1111-111111111111")
    p_case = uuid.UUID("22222222-2222-2222-2222-222222222222")
    p_charger = uuid.UUID("33333333-3333-3333-3333-333333333333")
    p_laptop = uuid.UUID("44444444-4444-4444-4444-444444444444")

    # Baskets of purchases
    transactions = [
        [p_phone, p_case, p_charger],
        [p_phone, p_case],
        [p_phone, p_charger],
        [p_laptop],
    ]

    engine.fit_transactions(transactions)

    # Co-occurrences with phone
    related_to_phone = engine.get_related(p_phone, top_k=5)
    assert len(related_to_phone) == 2
    related_ids = [item[0] for item in related_to_phone]

    assert p_case in related_ids
    assert p_charger in related_ids
    assert p_laptop not in related_ids

    # Laptop was never bought with phone, so related list for laptop should be empty
    related_to_laptop = engine.get_related(p_laptop, top_k=5)
    assert related_to_laptop == []


def test_cooccurrence_unknown_item():
    engine = CooccurrenceEngine()
    engine.fit_transactions([])
    assert engine.get_related(uuid.uuid4()) == []
