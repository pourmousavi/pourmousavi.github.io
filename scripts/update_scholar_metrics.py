#!/usr/bin/env python3
import json
import os
import sys
import time
from datetime import date
from pathlib import Path

import requests


AUTHOR_ID = os.environ.get("SCHOLAR_AUTHOR_ID", "XoHCLowAAAAJ")
API_KEY = os.environ.get("SERPAPI_API_KEY")
OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "scholar_metrics.json"
)

if not API_KEY:
    print("SERPAPI_API_KEY is not set. Exiting without changes.")
    sys.exit(0)

URL = "https://serpapi.com/search"
params = {
    "engine": "google_scholar_author",
    "hl": "en",
    "author_id": AUTHOR_ID,
    "api_key": API_KEY,
}


def fetch_with_retries(url, params, attempts=3, delay=3):
    last_err = None
    for i in range(attempts):
        try:
            resp = requests.get(url, params=params, timeout=20)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            last_err = e
            if i < attempts - 1:
                time.sleep(delay)
    raise last_err


try:
    data = fetch_with_retries(URL, params)
except Exception as e:
    print(f"Failed to fetch Scholar data after retries: {e}")
    # Exit without changes to keep previous metrics
    sys.exit(0)

# Try to extract totals with fallbacks (SerpAPI can evolve)


def extract_total_citations(d):
    # Common structure: d['cited_by']['table'][0]['citations']['all']
    try:
        table = d.get("cited_by", {}).get("table", [])
        for row in table:
            c = row.get("citations", {})
            # prefer 'all', fallback to sum of values
            if "all" in c:
                return int(c["all"])
            # sometimes citations might be a dict of {'since_2019': N}
            vals = [v for v in c.values() if isinstance(v, (int, float, str))]
            if vals:
                try:
                    return int(vals[0])
                except Exception:
                    pass
    except Exception:
        pass
    # Another structure: d['cited_by']['graph'] could be an array of points
    try:
        graph = d.get("cited_by", {}).get("graph", [])
        if graph:
            return int(graph[-1].get("cited_by_count", 0))
    except Exception:
        pass
    return None


def extract_hindex(d):
    # Common structure: d['h_index'] or in d['indices']['h_index']
    try:
        if "h_index" in d:
            return int(d["h_index"])
        indices = d.get("indices", {})
        if "h_index" in indices:
            return int(indices["h_index"])
        # Sometimes found in d['cited_by']['indices']
        cb_idx = d.get("cited_by", {}).get("indices", {})
        if "h_index" in cb_idx:
            return int(cb_idx["h_index"])
    except Exception:
        pass
    return None


total_citations = extract_total_citations(data)
h_index = extract_hindex(data)

if total_citations is None and h_index is None:
    print("Could not extract metrics from response. Exiting without changes.")
    sys.exit(0)

# Load existing JSON to avoid unnecessary diffs
existing = {}
try:
    with OUTPUT_PATH.open("r", encoding="utf-8") as f:
        existing = json.load(f)
except Exception:
    pass

updated = dict(existing)
updated["lastUpdated"] = date.today().isoformat()
if total_citations is not None:
    # Monotonic non-decreasing to avoid transient API regressions
    prev = existing.get("totalCitations")
    val = int(total_citations)
    if isinstance(prev, int):
        updated["totalCitations"] = max(prev, val)
    else:
        updated["totalCitations"] = val
if h_index is not None:
    prev = existing.get("hIndex")
    val = int(h_index)
    if isinstance(prev, int):
        updated["hIndex"] = max(prev, val)
    else:
        updated["hIndex"] = val

# Only write if changed
if updated != existing:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2)
    print("scholar_metrics.json updated.")
else:
    print("No changes to scholar_metrics.json.")
