from portfolio_hardening.http_cache import cache_key, entity_tag, evaluate_cache


def test_etag_is_deterministic() -> None:
    assert entity_tag(b"same") == entity_tag(b"same")
    assert entity_tag(b"same") != entity_tag(b"changed")


def test_if_none_match_supports_multiple_tags_and_wildcard() -> None:
    body = b"city-data"
    tag = entity_tag(body)
    assert evaluate_cache(body, tag).not_modified is True
    assert evaluate_cache(body, '"other", ' + tag).not_modified is True
    assert evaluate_cache(body, "*").not_modified is True
    assert evaluate_cache(body, '"other"').not_modified is False


def test_cache_key_normalizes_query_parameter_order() -> None:
    assert cache_key("get", "/api/cities", "b=2&a=1") == cache_key(
        "GET", "/api/cities", "a=1&b=2"
    )
