from __future__ import annotations

import hashlib
from dataclasses import dataclass


@dataclass(frozen=True)
class CacheResult:
    etag: str
    not_modified: bool


def entity_tag(body: bytes) -> str:
    digest = hashlib.sha256(body).hexdigest()
    return f'"{digest}"'


def evaluate_cache(body: bytes, if_none_match: str | None) -> CacheResult:
    etag = entity_tag(body)
    supplied = (if_none_match or "").strip()
    candidates = {part.strip() for part in supplied.split(",") if part.strip()}
    return CacheResult(etag=etag, not_modified=etag in candidates or "*" in candidates)


def cache_key(method: str, path: str, query: str = "") -> str:
    normalized = "&".join(sorted(item for item in query.split("&") if item))
    material = f"{method.upper()}|{path}|{normalized}"
    return hashlib.sha256(material.encode("utf-8")).hexdigest()
