#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,hashlib,json,re
from pathlib import Path
def slug(v): return re.sub(r"[^a-z0-9]+","-",str(v or "").lower().replace("&"," and ")).strip("-") or "unknown"
def split(v): return [x.strip() for x in str(v or "").split("|") if x.strip()]
def digest(p):
 h=hashlib.sha256();
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""): h.update(b)
 return h.hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument("manifest",type=Path);ap.add_argument("--media-dir",type=Path,default=Path("."));ap.add_argument("--output",type=Path,default=Path("museum-ingestion-review.json"));a=ap.parse_args();rows=[];seen={}
 with a.manifest.open(encoding="utf-8",newline="") as f:
  for i,row in enumerate(csv.DictReader(f),1):
   p=a.media_dir/row.get("file","");rec={"id":f"import-{i:05d}","file":row.get("file",""),"type":row.get("type","") or "unknown","title":row.get("title",""),"date":row.get("date",""),"year":int(row["year"]) if str(row.get("year","")).isdigit() else None,"promoter":row.get("promoter",""),"venue":row.get("venue",""),"djs":split(row.get("djs")),"mcs":split(row.get("mcs")),"credit":row.get("credit",""),"source":row.get("source",""),"status":"review"}
   if p.exists():
    d=digest(p);rec["sha256"]=d
    if d in seen: rec["duplicateOf"]=seen[d];rec["status"]="duplicate-review"
    else: seen[d]=rec["id"]
   else: rec["status"]="missing-file"
   rec["suggestedIds"]={"promoterId":slug(rec["promoter"]) if rec["promoter"] else None,"venueId":slug(rec["venue"]) if rec["venue"] else None,"artistIds":[slug(x) for x in rec["djs"]+rec["mcs"]]};rows.append(rec)
 a.output.write_text(json.dumps({"records":rows},indent=2,ensure_ascii=False),encoding="utf-8");print(json.dumps({"records":len(rows),"duplicates":sum(bool(x.get("duplicateOf")) for x in rows),"missingFiles":sum(x["status"]=="missing-file" for x in rows),"output":str(a.output)},indent=2))
if __name__=="__main__": main()
