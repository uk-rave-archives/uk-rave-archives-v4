#!/usr/bin/env python3
"""
Back to the Old Skool Archive — YouTube Comment Tracklist Importer

Reads videos from youtube-archive-data.js, downloads public top-level comments
through the official YouTube Data API, selects likely tracklist comments, parses
timestamped tracks, matches artist names against artists-data.js and writes:

  youtube-tracklists-data.js
  youtube-tracklists-review.csv
  youtube-tracklists-report.json

Usage:
  export YOUTUBE_API_KEY="your-key"
  python youtube-comment-tracklist-importer.py

Alternative offline import:
  python youtube-comment-tracklist-importer.py --comments-json comments-export.json

The offline JSON format is:
{
  "VIDEO_ID": [
    {"author": "name", "text": "0:00 Artist - Track [Label]..."},
    ...
  ]
}
"""

from __future__ import annotations

import argparse
import csv
import html
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
VIDEO_DATA = ROOT / "youtube-archive-data.js"
ARTIST_DATA = ROOT / "artists-data.js"
OUTPUT_JS = ROOT / "youtube-tracklists-data.js"
REVIEW_CSV = ROOT / "youtube-tracklists-review.csv"
REPORT_JSON = ROOT / "youtube-tracklists-report.json"

TIMESTAMP_RE = re.compile(
    r"(?<!\d)(?:(?P<h>\d{1,2}):)?(?P<m>\d{1,2}):(?P<s>\d{2})(?!\d)"
)
TRACK_LINE_RE = re.compile(
    r"""^\s*
    (?P<timestamp>(?:(?:\d{1,2}:)?\d{1,2}:\d{2}))
    \s*(?:[-–—:|]\s*)?
    (?P<body>.+?)
    \s*$""",
    re.VERBOSE,
)
LABEL_RE = re.compile(r"\s*[\[(](?P<label>[^\]\)]+)[\])]\s*$")
CATALOGUE_RE = re.compile(r"\b[A-Z][A-Z0-9]{1,8}[-\s]?\d{1,5}\b", re.I)
REMIX_RE = re.compile(r"\(([^)]*(?:mix|remix|edit|dub)[^)]*)\)", re.I)

MANUAL_ALIASES = {
    "dj hype": "dj-hype",
    "hype": "dj-hype",
    "shy fx": "shy-fx",
    "shy f.x.": "shy-fx",
    "ltj bukem": "ltj-bukem",
    "bukem": "ltj-bukem",
    "roni size": "roni-size",
    "grooverider": "grooverider",
    "groove rider": "grooverider",
    "mc det": "mc-det",
    "slipmatt": "slipmatt",
    "slip matt": "slipmatt",
    "dougal": "dougal",
    "dj dougal": "dougal",
    "vibes": "vibes",
    "dj vibes": "vibes",
    "hixxy": "hixxy",
    "seduction": "dj-seduction",
    "dj seduction": "dj-seduction",
    "brisk": "brisk",
    "dj brisk": "brisk",
    "dj ss": "dj-ss",
    "ss": "dj-ss",
    "jumping jack frost": "jumping-jack-frost",
    "jumpin jack frost": "jumping-jack-frost",
    "mickey finn": "mickey-finn",
    "micky finn": "mickey-finn",
    "fabio": "fabio",
    "carl cox": "carl-cox",
    "randall": "randall",
    "kenny ken": "kenny-ken",
    "ellis dee": "ellis-dee",
    "easygroove": "easygroove",
    "ratty": "ratty",
}


def read_js_array(path: Path, variable: str) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    match = re.search(
        rf"window\.{re.escape(variable)}\s*=\s*(\[.*\])\s*;?\s*$",
        text,
        flags=re.S,
    )
    if not match:
        raise ValueError(f"Could not locate window.{variable} in {path.name}")
    return json.loads(match.group(1))


def normalize(text: str) -> str:
    text = html.unescape(text).lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def seconds(timestamp: str) -> int:
    parts = [int(part) for part in timestamp.split(":")]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    return parts[0] * 3600 + parts[1] * 60 + parts[2]


def score_comment(text: str) -> int:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    timestamp_lines = sum(bool(TRACK_LINE_RE.match(line)) for line in lines)
    timestamps = len(TIMESTAMP_RE.findall(text))
    score = timestamp_lines * 12 + timestamps * 3
    lower = text.lower()
    if "tracklist" in lower or "track list" in lower:
        score += 20
    if len(lines) >= 8:
        score += 8
    if len(text) >= 500:
        score += 8
    return score


def split_artist_title(body: str) -> tuple[str, str]:
    # Remove leading numbering.
    body = re.sub(r"^\s*(?:\d+[\.\)]\s*)", "", body).strip()
    # Prefer spaced separators to avoid breaking hyphenated names.
    for separator in (" – ", " — ", " - ", " :: ", " | "):
        if separator in body:
            left, right = body.split(separator, 1)
            return left.strip(), right.strip()
    return "", body.strip()


def parse_track_line(line: str) -> dict[str, Any] | None:
    match = TRACK_LINE_RE.match(line)
    if not match:
        return None

    timestamp = match.group("timestamp")
    body = match.group("body").strip(" -–—|:")
    label = ""
    label_match = LABEL_RE.search(body)
    if label_match:
        label = label_match.group("label").strip()
        body = body[: label_match.start()].strip()

    artist, title = split_artist_title(body)
    remix = ""
    remix_match = REMIX_RE.search(title)
    if remix_match:
        remix = remix_match.group(1).strip()

    catalogue = ""
    catalogue_match = CATALOGUE_RE.search(label)
    if catalogue_match:
        catalogue = catalogue_match.group(0)

    return {
        "timestamp": timestamp,
        "seconds": seconds(timestamp),
        "artist": artist,
        "title": title,
        "remix": remix,
        "label": label,
        "catalogue": catalogue,
        "raw": line.strip(),
    }


def parse_tracklist(text: str) -> list[dict[str, Any]]:
    tracks: list[dict[str, Any]] = []
    for raw_line in text.replace("\r", "\n").split("\n"):
        line = re.sub(r"\s+", " ", raw_line).strip()
        parsed = parse_track_line(line)
        if parsed:
            tracks.append(parsed)

    # Remove exact duplicate timestamps/lines while preserving order.
    seen: set[tuple[int, str]] = set()
    clean: list[dict[str, Any]] = []
    for track in sorted(tracks, key=lambda item: item["seconds"]):
        key = (track["seconds"], normalize(track["raw"]))
        if key not in seen:
            seen.add(key)
            clean.append(track)
    return clean


def build_alias_map(artists: list[dict[str, Any]]) -> dict[str, str]:
    aliases = dict(MANUAL_ALIASES)
    for artist in artists:
        artist_id = artist.get("id")
        name = artist.get("name")
        if artist_id and name:
            aliases[normalize(name)] = artist_id
        for alias in artist.get("aliases", []) or []:
            aliases[normalize(alias)] = artist_id
    return aliases


def match_artist_ids(artist_text: str, alias_map: dict[str, str]) -> list[str]:
    if not artist_text:
        return []
    normalized = normalize(artist_text)
    direct = alias_map.get(normalized)
    if direct:
        return [direct]

    matches: list[str] = []
    for alias, artist_id in alias_map.items():
        if len(alias) >= 4 and re.search(rf"\b{re.escape(alias)}\b", normalized):
            if artist_id not in matches:
                matches.append(artist_id)
    return matches


def api_get(endpoint: str, params: dict[str, str], api_key: str) -> dict[str, Any]:
    query = dict(params)
    query["key"] = api_key
    url = "https://www.googleapis.com/youtube/v3/" + endpoint + "?" + urllib.parse.urlencode(query)
    request = urllib.request.Request(url, headers={"User-Agent": "BTOS-Archive-Importer/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except Exception as exc:
        raise RuntimeError(f"YouTube API request failed for {endpoint}: {exc}") from exc


def fetch_comments(video_id: str, api_key: str) -> list[dict[str, str]]:
    comments: list[dict[str, str]] = []
    page_token = ""
    while True:
        params = {
            "part": "snippet",
            "videoId": video_id,
            "maxResults": "100",
            "textFormat": "plainText",
            "order": "relevance",
        }
        if page_token:
            params["pageToken"] = page_token
        data = api_get("commentThreads", params, api_key)
        for item in data.get("items", []):
            snippet = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "author": snippet.get("authorDisplayName", ""),
                "text": snippet.get("textDisplay", ""),
            })
        page_token = data.get("nextPageToken", "")
        if not page_token:
            break
        time.sleep(0.05)
    return comments


def choose_tracklist(comments: list[dict[str, str]]) -> tuple[dict[str, str] | None, int]:
    ranked = sorted(
        ((score_comment(comment.get("text", "")), comment) for comment in comments),
        key=lambda pair: pair[0],
        reverse=True,
    )
    if not ranked or ranked[0][0] < 24:
        return None, 0
    return ranked[0][1], ranked[0][0]


def write_outputs(results: list[dict[str, Any]], review_rows: list[dict[str, Any]], report: dict[str, Any]) -> None:
    OUTPUT_JS.write_text(
        "window.BTOS_YOUTUBE_TRACKLISTS = " +
        json.dumps(results, indent=2, ensure_ascii=False) +
        ";\n",
        encoding="utf-8",
    )

    with REVIEW_CSV.open("w", encoding="utf-8", newline="") as handle:
        fieldnames = [
            "videoId", "videoTitle", "timestamp", "artist", "title",
            "remix", "label", "catalogue", "matchedArtistIds", "raw",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(review_rows)

    REPORT_JSON.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--comments-json", type=Path)
    parser.add_argument("--limit", type=int, default=0, help="Import only the first N videos")
    args = parser.parse_args()

    videos = read_js_array(VIDEO_DATA, "BTOS_YOUTUBE")
    artists = read_js_array(ARTIST_DATA, "BTOS_ARTISTS")
    alias_map = build_alias_map(artists)
    if args.limit:
        videos = videos[: args.limit]

    offline_comments: dict[str, list[dict[str, str]]] = {}
    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if args.comments_json:
        offline_comments = json.loads(args.comments_json.read_text(encoding="utf-8"))
    elif not api_key:
        print(
            "No comments source supplied.\n"
            "Set YOUTUBE_API_KEY or use --comments-json comments-export.json.",
            file=sys.stderr,
        )
        return 2

    results: list[dict[str, Any]] = []
    review_rows: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []

    for index, video in enumerate(videos, start=1):
        video_id = video["id"]
        print(f"[{index}/{len(videos)}] {video_id} — {video['title']}")
        try:
            comments = (
                offline_comments.get(video_id, [])
                if args.comments_json
                else fetch_comments(video_id, api_key)
            )
            selected, score = choose_tracklist(comments)
            if not selected:
                results.append({
                    "videoId": video_id,
                    "status": "no-tracklist-found",
                    "commentCountChecked": len(comments),
                    "tracks": [],
                })
                continue

            tracks = parse_tracklist(selected["text"])
            for track in tracks:
                track["matchedArtistIds"] = match_artist_ids(track["artist"], alias_map)
                review_rows.append({
                    "videoId": video_id,
                    "videoTitle": video["title"],
                    "timestamp": track["timestamp"],
                    "artist": track["artist"],
                    "title": track["title"],
                    "remix": track["remix"],
                    "label": track["label"],
                    "catalogue": track["catalogue"],
                    "matchedArtistIds": "|".join(track["matchedArtistIds"]),
                    "raw": track["raw"],
                })

            results.append({
                "videoId": video_id,
                "videoTitle": video["title"],
                "year": video.get("year"),
                "sourceCommentAuthor": selected.get("author", ""),
                "tracklistScore": score,
                "commentCountChecked": len(comments),
                "status": "parsed" if tracks else "comment-selected-no-tracks",
                "tracks": tracks,
            })
        except Exception as exc:
            failures.append({"videoId": video_id, "error": str(exc)})
            results.append({
                "videoId": video_id,
                "status": "error",
                "error": str(exc),
                "tracks": [],
            })

    report = {
        "videosProcessed": len(videos),
        "tracklistsParsed": sum(item["status"] == "parsed" for item in results),
        "tracksParsed": sum(len(item.get("tracks", [])) for item in results),
        "artistMatches": sum(
            len(track.get("matchedArtistIds", []))
            for item in results
            for track in item.get("tracks", [])
        ),
        "failures": failures,
    }
    write_outputs(results, review_rows, report)
    print(json.dumps(report, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
