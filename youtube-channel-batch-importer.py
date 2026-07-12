#!/usr/bin/env python3
"""
Back to the Old Skool Archive — YouTube Channel Batch Importer

Imports the next N channel uploads using YouTube Data API v3.
It does NOT read comments.

Outputs:
- youtube-archive-data.generated.js
- youtube-video-review.csv
- youtube-video-import-report.json

Usage:
    export YOUTUBE_API_KEY="YOUR_KEY"
    python youtube-channel-batch-importer.py --limit 100

Windows PowerShell:
    $env:YOUTUBE_API_KEY="YOUR_KEY"
    python youtube-channel-batch-importer.py --limit 100
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
CHANNEL_ID = "UCkhQFT5g23XpcZJO5npphSA"
EXISTING_JS = ROOT / "youtube-archive-data.js"
ARTISTS_JS = ROOT / "artists-data.js"
OUTPUT_JS = ROOT / "youtube-archive-data.generated.js"
REVIEW_CSV = ROOT / "youtube-video-review.csv"
REPORT_JSON = ROOT / "youtube-video-import-report.json"

YEAR_RE = re.compile(r"\b(19(?:8[8-9]|9\d)|200[0-5])\b")
DATE_RE = re.compile(r"\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})\b")
CD_RE = re.compile(r"\bCD\s*(\d+)\b", re.I)

ALIASES = {
    "dj hype": "dj-hype",
    "hype": "dj-hype",
    "shy fx": "shy-fx",
    "ltj bukem": "ltj-bukem",
    "roni size": "roni-size",
    "grooverider": "grooverider",
    "mc det": "mc-det",
    "dougal": "dougal",
    "dj dougal": "dougal",
    "vibes": "vibes",
    "dj vibes": "vibes",
    "slipmatt": "slipmatt",
    "slip matt": "slipmatt",
    "hixxy": "hixxy",
    "seduction": "dj-seduction",
    "dj seduction": "dj-seduction",
    "brisk": "brisk",
    "dj brisk": "brisk",
    "sy": "sy",
    "dj sy": "sy",
    "dj ss": "dj-ss",
    "jumping jack frost": "jumping-jack-frost",
    "jumpin jack frost": "jumping-jack-frost",
    "mickey finn": "mickey-finn",
    "micky finn": "mickey-finn",
    "randall": "randall",
    "kenny ken": "kenny-ken",
    "ellis dee": "ellis-dee",
    "easygroove": "easygroove",
    "ratty": "ratty",
    "colin bell": "colin-bell",
    "dj colin bell": "colin-bell",
}

EVENT_HINTS = [
    "tazzmania", "dance planet", "united dance", "helter skelter",
    "dreamscape", "fantazia", "slammin vinyl", "vibealite", "obsession",
    "evolution", "the edge", "bonkers", "hardcore heaven", "hardcore happiness",
]

def api_get(endpoint: str, params: dict[str, str], key: str) -> dict[str, Any]:
    query = dict(params)
    query["key"] = key
    url = "https://www.googleapis.com/youtube/v3/" + endpoint + "?" + urllib.parse.urlencode(query)
    req = urllib.request.Request(url, headers={"User-Agent": "BTOS-Video-Importer/1.0"})
    with urllib.request.urlopen(req, timeout=40) as response:
        return json.load(response)

def read_js_array(path: Path, variable: str) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    match = re.search(rf"window\.{re.escape(variable)}\s*=\s*(\[.*\])\s*;", text, re.S)
    if not match:
        raise ValueError(f"Unable to read {variable} from {path}")
    return json.loads(match.group(1))

def normalize(text: str) -> str:
    text = text.lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def build_aliases(artists: list[dict[str, Any]]) -> dict[str, str]:
    aliases = dict(ALIASES)
    for artist in artists:
        if artist.get("id") and artist.get("name"):
            aliases[normalize(artist["name"])] = artist["id"]
        for alias in artist.get("aliases", []) or []:
            aliases[normalize(alias)] = artist["id"]
    return aliases

def match_artists(title: str, aliases: dict[str, str]) -> list[str]:
    text = normalize(title)
    matches = []
    # Longest aliases first to avoid "sy" matching ordinary words.
    for alias, artist_id in sorted(aliases.items(), key=lambda x: len(x[0]), reverse=True):
        if len(alias) <= 2:
            pattern = rf"(?:^|\s){re.escape(alias)}(?:\s|$)"
        else:
            pattern = rf"\b{re.escape(alias)}\b"
        if re.search(pattern, text) and artist_id not in matches:
            matches.append(artist_id)
    return matches

def parse_year(title: str) -> int | None:
    match = YEAR_RE.search(title)
    return int(match.group(1)) if match else None

def parse_date(title: str) -> str:
    match = DATE_RE.search(title)
    if not match:
        return ""
    day, month, year = map(int, match.groups())
    if year < 100:
        year += 1900 if year >= 88 else 2000
    try:
        value = dt.date(year, month, day)
        return value.strftime("%-d %B %Y")
    except ValueError:
        return ""

def classify(title: str) -> str:
    lower = title.lower()
    if any(word in lower for word in ("kiss fm", "radio", "kool fm", "fantasy fm")):
        return "radio-set"
    if any(word in lower for word in ("mixed by", "volume", "vol.", "cd 1", "cd 2", "cd 3", "mix")):
        return "dj-mix"
    if any(word in lower for word in ("b2b", "live", "tazzmania", "dance planet", "united dance", "helter skelter")):
        return "dj-set"
    return "video"

def event_name(title: str) -> str:
    # Remove trailing DJ credit where possible.
    value = re.sub(r"\s*[-–—]\s*(?:CD\s*\d+\s*)?\([^)]*\)\s*$", "", title).strip()
    value = re.sub(r"\s*[-–—]\s*(?:DJ\s+)?[A-Za-z0-9 &'.]+\s*$", "", value).strip()
    return value or title

def thumbnail_set(video_id: str) -> tuple[str, list[str]]:
    return (
        f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        [
            f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
            f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
            f"https://i.ytimg.com/vi/{video_id}/default.jpg",
        ],
    )

def get_upload_playlist(key: str) -> str:
    data = api_get("channels", {"part": "contentDetails", "id": CHANNEL_ID}, key)
    items = data.get("items", [])
    if not items:
        raise RuntimeError("Channel not found")
    return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

def list_upload_ids(playlist_id: str, limit: int, key: str) -> list[str]:
    ids = []
    token = ""
    while len(ids) < limit:
        params = {
            "part": "contentDetails",
            "playlistId": playlist_id,
            "maxResults": str(min(50, limit - len(ids))),
        }
        if token:
            params["pageToken"] = token
        data = api_get("playlistItems", params, key)
        ids.extend(item["contentDetails"]["videoId"] for item in data.get("items", []))
        token = data.get("nextPageToken", "")
        if not token:
            break
        time.sleep(0.05)
    return ids[:limit]

def fetch_video_details(ids: list[str], key: str) -> list[dict[str, Any]]:
    details = []
    for start in range(0, len(ids), 50):
        batch = ids[start:start+50]
        data = api_get("videos", {
            "part": "snippet,contentDetails,status",
            "id": ",".join(batch),
            "maxResults": "50",
        }, key)
        details.extend(data.get("items", []))
        time.sleep(0.05)
    return details

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()

    key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if not key:
        print("Set YOUTUBE_API_KEY before running this importer.", file=sys.stderr)
        return 2

    existing = read_js_array(EXISTING_JS, "BTOS_YOUTUBE")
    artists = read_js_array(ARTISTS_JS, "BTOS_ARTISTS")
    existing_ids = {item["id"] for item in existing}
    aliases = build_aliases(artists)

    playlist = get_upload_playlist(key)
    upload_ids = list_upload_ids(playlist, args.limit, key)
    details = fetch_video_details(upload_ids, key)

    imported = []
    review_rows = []
    duplicates = 0

    for item in details:
        video_id = item["id"]
        if video_id in existing_ids:
            duplicates += 1
            continue

        snippet = item["snippet"]
        title = snippet.get("title", "").strip()
        artists_found = match_artists(title, aliases)
        year = parse_year(title)
        date = parse_date(title)
        video_type = classify(title)
        thumbnail, fallbacks = thumbnail_set(video_id)

        record = {
            "id": video_id,
            "title": title,
            "year": year,
            "type": video_type,
            "artists": artists_found,
            "trackAppearances": [],
            "event": event_name(title),
            "date": date,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail": thumbnail,
            "thumbnailFallbacks": fallbacks,
            "channel": "happyhardcore95to99(take2)",
            "channelUrl": "https://www.youtube.com/@happyhardcore95to99backup",
            "displayType": {
                "dj-set": "Live DJ set",
                "dj-mix": "DJ mix / compilation",
                "radio-set": "Radio set",
                "video": "YouTube archive",
            }[video_type],
            "sourceCredit": "HappyHardcore95to99 Backup",
            "description": " · ".join(x for x in [event_name(title), date, str(year or "")] if x),
            "reviewStatus": "mapped" if artists_found and year else "review",
            "publishedAt": snippet.get("publishedAt", ""),
        }
        imported.append(record)
        if record["reviewStatus"] == "review":
            review_rows.append({
                "videoId": video_id,
                "title": title,
                "year": year or "",
                "matchedArtistIds": "|".join(artists_found),
                "suggestedType": video_type,
                "event": record["event"],
                "reason": "Missing confident artist match or archive year",
            })

    combined = existing + imported
    OUTPUT_JS.write_text(
        "window.BTOS_YOUTUBE = " + json.dumps(combined, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )

    with REVIEW_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            "videoId", "title", "year", "matchedArtistIds",
            "suggestedType", "event", "reason",
        ])
        writer.writeheader()
        writer.writerows(review_rows)

    report = {
        "requested": args.limit,
        "channelUploadsRead": len(details),
        "alreadyPresent": duplicates,
        "newRecords": len(imported),
        "mappedReady": sum(r["reviewStatus"] == "mapped" for r in imported),
        "needsReview": len(review_rows),
        "outputFile": OUTPUT_JS.name,
    }
    REPORT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
