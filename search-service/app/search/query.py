from typing import Any, Dict, List, Optional
from app.schemas.search import SearchParams, SortOption


def build_search_query(params: SearchParams) -> Dict[str, Any]:
    must_clauses: List[Dict[str, Any]] = []
    filter_clauses: List[Dict[str, Any]] = []

    # 1. Full-Text Query
    if params.q and params.q.strip():
        q_clean = params.q.strip()
        must_clauses.append({
            "multi_match": {
                "query": q_clean,
                "fields": [
                    "name^4",
                    "name.autocomplete^2",
                    "brand_name^2",
                    "category_name^1.5",
                    "description^1",
                    "attributes.*^1"
                ],
                "type": "best_fields",
                "fuzziness": "AUTO",
                "prefix_length": 2
            }
        })
    else:
        must_clauses.append({"match_all": {}})

    # 2. Filters
    if params.status:
        filter_clauses.append({"term": {"status": params.status}})

    if params.category_id:
        filter_clauses.append({"term": {"category_id": params.category_id}})

    if params.brand_id:
        filter_clauses.append({"term": {"brand_id": params.brand_id}})

    if params.min_price is not None or params.max_price is not None:
        price_range: Dict[str, Any] = {}
        if params.min_price is not None:
            price_range["gte"] = params.min_price
        if params.max_price is not None:
            price_range["lte"] = params.max_price
        filter_clauses.append({"range": {"price": price_range}})

    # 3. Sort
    sort_clauses: List[Any] = []
    if params.sort == SortOption.PRICE_ASC:
        sort_clauses.append({"price": {"order": "asc"}})
    elif params.sort == SortOption.PRICE_DESC:
        sort_clauses.append({"price": {"order": "desc"}})
    elif params.sort == SortOption.NEWEST:
        sort_clauses.append({"created_at": {"order": "desc"}})
    else:  # RELEVANCE
        if params.q and params.q.strip():
            sort_clauses.append({"_score": {"order": "desc"}})
        else:
            sort_clauses.append({"created_at": {"order": "desc"}})

    # 4. Aggregations / Facets
    aggs = {
        "categories": {
            "terms": {
                "field": "category_id",
                "size": 20
            }
        },
        "brands": {
            "terms": {
                "field": "brand_id",
                "size": 20
            }
        },
        "price_stats": {
            "stats": {
                "field": "price"
            }
        }
    }

    # 5. Pagination
    from_offset = (params.page - 1) * params.size

    query_body = {
        "from": from_offset,
        "size": params.size,
        "query": {
            "bool": {
                "must": must_clauses,
                "filter": filter_clauses
            }
        },
        "sort": sort_clauses,
        "aggs": aggs
    }

    return query_body


def build_autocomplete_query(prefix: str, size: int = 10) -> Dict[str, Any]:
    return {
        "suggest": {
            "product_suggest": {
                "prefix": prefix,
                "completion": {
                    "field": "suggest",
                    "size": size,
                    "skip_duplicates": True,
                    "fuzzy": {
                        "fuzziness": "AUTO"
                    }
                }
            }
        }
    }


def build_fallback_autocomplete_query(prefix: str, size: int = 10) -> Dict[str, Any]:
    return {
        "size": size,
        "query": {
            "bool": {
                "must": [
                    {
                        "match": {
                            "name.autocomplete": {
                                "query": prefix,
                                "analyzer": "autocomplete_search_analyzer"
                            }
                        }
                    }
                ],
                "filter": [
                    {"term": {"status": "ACTIVE"}}
                ]
            }
        },
        "_source": ["name", "product_id", "category_name", "brand_name"]
    }
