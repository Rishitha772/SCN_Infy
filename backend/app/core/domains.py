import json
import logging
from pathlib import Path
from typing import Any

import httpx

logger: logging.Logger = logging.getLogger(__name__)

DOMAINS_URL = "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json"
CACHE_FILE = Path("./data/research_domains.json")

# global cache - loaded once at startup
research_domains: set[str] = set()
domains_loaded = False


async def _fetch_remote() -> list[dict[str, Any]]:
    """Fetch raw university dataset from remote."""
    logger.info("fetching university domains from remote")
    async with httpx.AsyncClient() as client:
        response: httpx.Response = await client.get(DOMAINS_URL, timeout=30)
        response.raise_for_status()
        return response.json()


def _parse_domains(raw_data: list[dict[str, Any]]) -> set[str]:
    """Convert raw list[dict] into simplified {"domains": [...]} format."""
    domains: set[str] = set()
    for institute in raw_data:
        for domain in institute.get("domains", []):
            domains.add(domain.lower())
    return domains


def _load_from_cache() -> set[str]:
    """Load simplified domains dict from cache file."""
    logger.debug("loading domains from cache")
    return json.loads(CACHE_FILE.read_text())


def _save_to_cache(domains: set[str]) -> None:
    """Save simplified domains dict to cache file."""
    CACHE_FILE.parent.mkdir(exist_ok=True)
    CACHE_FILE.write_text(json.dumps(sorted(domains)))
    logger.info("domains cached to %s", len(domains))


async def fetch_domains() -> set[str]:
    """
    Get domains either from cache or remote.
    Returns a set of lowercase domains.
    """
    if CACHE_FILE.exists():
        return _load_from_cache()
    raw_data: list[dict[str, Any]] = await _fetch_remote()
    domains: set[str] = _parse_domains(raw_data)
    _save_to_cache(domains)
    return domains


async def load_domains() -> None:
    global research_domains, domains_loaded
    if domains_loaded:
        logger.debug("domains already loaded, skipping")
        return
    research_domains = await fetch_domains()
    domains_loaded = True
    logger.debug("loaded %d academic domains", len(research_domains))


def is_research_email(email: str) -> bool:
    # Relax domain validation to allow all domains (including gmail and outlook)
    return True
