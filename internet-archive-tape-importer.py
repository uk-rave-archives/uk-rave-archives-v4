#!/usr/bin/env python3
"""
Internet Archive tape-pack metadata importer.

This importer reads one or more known Internet Archive item identifiers,
lists audio files from the official metadata endpoint, extracts probable
artist/year/side fields and creates a review CSV. It does not publish
uncertain matches automatically.

Usage:
  python internet-archive-tape-importer.py helter-skelter-tape-packs
  python internet-archive-tape-importer.py item-one item-two
"""
from __future__ import annotations
import argparse,csv,json,re,urllib.request,urllib.parse
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SIDE_RE=re.compile(r"\bSide\s*([AB12])\b",re.I)
YEAR_RE=re.compile(r"\b(19(?:8[8-9]|9\d)|200[0-5])\b")
AUDIO_EXT={".mp3",".ogg",".flac",".m4a",".wav"}

def fetch(item):
    url=f"https://archive.org/metadata/{urllib.parse.quote(item)}"
    with urllib.request.urlopen(url,timeout=45) as response:
        return json.load(response)

def parse_name(name):
    stem=re.sub(r"\.[A-Za-z0-9]+$","",name)
    year=(YEAR_RE.search(stem).group(1) if YEAR_RE.search(stem) else "")
    side=(SIDE_RE.search(stem).group(1).upper() if SIDE_RE.search(stem) else "")
    clean=re.sub(r"\([^)]*\)"," ",stem)
    parts=[p.strip() for p in re.split(r"\s+-\s+",clean) if p.strip()]
    artist=parts[-1] if parts else ""
    if artist.lower().startswith("side "):artist=""
    return year,side,artist

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("items",nargs="+")
    args=parser.parse_args()
    rows=[]
    for item in args.items:
        data=fetch(item)
        for f in data.get("files",[]):
            name=f.get("name","")
            if Path(name).suffix.lower() not in AUDIO_EXT:continue
            year,side,artist=parse_name(name)
            rows.append({
                "archiveItem":item,"filename":name,"year":year,"side":side,
                "artistGuess":artist,"titleGuess":Path(name).stem,
                "audioUrl":f"https://archive.org/download/{item}/{urllib.parse.quote(name,safe='/')}",
                "sourcePage":f"https://archive.org/details/{item}",
                "status":"review"
            })
    out=ROOT/"internet-archive-tape-review.csv"
    with out.open("w",newline="",encoding="utf-8") as h:
        fields=list(rows[0].keys()) if rows else ["archiveItem","filename","year","side","artistGuess","titleGuess","audioUrl","sourcePage","status"]
        w=csv.DictWriter(h,fieldnames=fields);w.writeheader();w.writerows(rows)
    print(json.dumps({"items":len(args.items),"audioFiles":len(rows),"reviewFile":out.name},indent=2))
if __name__=="__main__":main()
