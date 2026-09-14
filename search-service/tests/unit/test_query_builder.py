import pytest
from app.schemas.search import SearchParams, SortOption
from app.search.query import build_search_query, build_autocomplete_query, build_fallback_autocomplete_query


def test_build_search_query_default():
    params = SearchParams()
    query = build_search_query(params)

    assert query["from"] == 0
    assert query["size"] == 20
    assert "match_all" in query["query"]["bool"]["must"][0]
    assert len(query["query"]["bool"]["filter"]) == 1
    assert query["query"]["bool"]["filter"][0] == {"term": {"status": "ACTIVE"}}
    assert "aggs" in query


def test_build_search_query_with_keyword_and_filters():
    params = SearchParams(
        q="iphone 17",
        category_id="cat-phones",
        brand_id="brand-apple",
        min_price=500.0,
        max_price=1500.0,
        status="ACTIVE",
        sort=SortOption.PRICE_ASC,
        page=2,
        size=10
    )
    query = build_search_query(params)

    assert query["from"] == 10
    assert query["size"] == 10

    # Check multi_match query
    must = query["query"]["bool"]["must"][0]
    assert "multi_match" in must
    assert must["multi_match"]["query"] == "iphone 17"
    assert "fuzziness" in must["multi_match"]

    # Check filters
    filters = query["query"]["bool"]["filter"]
    filter_keys = [list(f.keys())[0] for f in filters]
    assert "term" in filter_keys
    assert "range" in filter_keys

    # Check sort
    assert query["sort"] == [{"price": {"order": "asc"}}]


def test_build_autocomplete_query():
    query = build_autocomplete_query("iph", size=5)
    assert "suggest" in query
    assert "product_suggest" in query["suggest"]
    assert query["suggest"]["product_suggest"]["prefix"] == "iph"
    assert query["suggest"]["product_suggest"]["completion"]["size"] == 5


def test_build_fallback_autocomplete_query():
    query = build_fallback_autocomplete_query("iph", size=5)
    assert query["size"] == 5
    assert "match" in query["query"]["bool"]["must"][0]
    assert query["query"]["bool"]["must"][0]["match"]["name.autocomplete"]["query"] == "iph"
